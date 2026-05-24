/**
 * GET: 项目列表
 * POST: 创建项目
 */
import { NextRequest, NextResponse } from "next/server";
import { getDisplayNameOrDid } from "@/lib/did";
import { recordProjectLedger } from "@/lib/projects/coin";
import { getProfileId, getServiceSupabase, notConfigured } from "@/lib/projects/request";

export async function GET(request: NextRequest) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = getServiceSupabase();
  const userId = getProfileId(request);
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  let query = supabase
    .from("projects")
    .select("id, founder_id, title, description, total_assets, total_revenue, status, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

  const { data: projects, error } = await query;
  if (error) {
    const msg = error.message.includes("projects")
      ? "项目模块需先执行数据库迁移 20260523_jihedao_projects.sql"
      : error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const rows = projects ?? [];
  const founderIds = [...new Set(rows.map((p) => (p as { founder_id: string }).founder_id))];
  let nameMap: Record<string, string> = {};
  if (founderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, fid, custom_did")
      .in("id", founderIds);
    for (const p of profiles ?? []) {
      nameMap[(p as { id: string }).id] = getDisplayNameOrDid(p as Parameters<typeof getDisplayNameOrDid>[0]);
    }
  }

  const projectIds = rows.map((p) => (p as { id: string }).id);
  const { data: members } = projectIds.length
    ? await supabase
        .from("project_members")
        .select("project_id, investment_coins, contribution_coins, status, user_id")
        .in("project_id", projectIds)
        .eq("status", "active")
    : { data: [] };

  const stats: Record<string, { count: number; coins: number }> = {};
  for (const m of members ?? []) {
    const pid = (m as { project_id: string }).project_id;
    if (!stats[pid]) stats[pid] = { count: 0, coins: 0 };
    stats[pid].count += 1;
    stats[pid].coins += Number((m as { investment_coins: number }).investment_coins) + Number((m as { contribution_coins: number }).contribution_coins);
  }

  const list = rows.map((p) => {
    const row = p as {
      id: string;
      founder_id: string;
      title: string;
      description: string;
      total_assets: number;
      total_revenue: number;
      status: string;
      created_at: string;
    };
    return {
      ...row,
      founder_name: nameMap[row.founder_id] ?? row.founder_id.slice(0, 8),
      member_count: stats[row.id]?.count ?? 0,
      total_jihe_coins: stats[row.id]?.coins ?? 0,
      is_member: userId
        ? (members ?? []).some(
            (m) => (m as { project_id: string; user_id: string }).project_id === row.id && (m as { user_id: string }).user_id === userId
          )
        : false,
    };
  });

  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title?: string; description?: string; rules_text?: string; initial_investment?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim();
  const rules_text = (body.rules_text ?? "").trim();
  const initialInvestment = Math.max(0, Number(body.initial_investment) || 0);

  if (!title) return NextResponse.json({ error: "标题必填" }, { status: 400 });
  if (!description) return NextResponse.json({ error: "项目介绍必填" }, { status: 400 });

  const supabase = getServiceSupabase();

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .insert({
      founder_id: userId,
      title: title.slice(0, 200),
      description: description.slice(0, 10000),
      rules_text: rules_text.slice(0, 20000) || "待股东共同商定项目规则。",
      total_assets: initialInvestment,
    })
    .select("*")
    .single();

  if (pErr) {
    const msg = pErr.message.includes("projects")
      ? "项目模块需先执行数据库迁移 20260523_jihedao_projects.sql"
      : pErr.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const projectId = (project as { id: string }).id;

  await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    role: "founder",
    investment_coins: initialInvestment,
    contribution_coins: 0,
  });

  if (initialInvestment > 0) {
    await recordProjectLedger(supabase, {
      projectId,
      userId,
      amount: initialInvestment,
      coinType: "investment",
      reason: "发起人初始投资",
      referenceType: "create",
      referenceId: projectId,
    });
  }

  return NextResponse.json(project);
}
