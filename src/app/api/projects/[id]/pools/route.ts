/**
 * GET: 月度贡献池列表
 * POST: 股东发起设定贡献池议案 { year_month, pool_amount }
 */
import { NextRequest, NextResponse } from "next/server";
import { getProjectMember } from "@/lib/projects/motions";
import { isShareholder } from "@/lib/projects/roles";
import { getProfileId, getServiceSupabase, notConfigured } from "@/lib/projects/request";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const { id } = await params;
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("monthly_contribution_pools")
    .select("*")
    .eq("project_id", id)
    .order("year_month", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  let body: { year_month?: string; pool_amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const yearMonth = (body.year_month ?? "").trim();
  const poolAmount = Number(body.pool_amount);
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return NextResponse.json({ error: "year_month 格式须为 YYYY-MM" }, { status: 400 });
  }
  if (!Number.isFinite(poolAmount) || poolAmount < 0) {
    return NextResponse.json({ error: "pool_amount 无效" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const actor = await getProjectMember(supabase, projectId, userId);
  if (!actor || actor.status !== "active" || !isShareholder(actor.role)) {
    return NextResponse.json({ error: "仅股东可发起贡献池议案" }, { status: 403 });
  }

  const { data: motion, error } = await supabase
    .from("shareholder_motions")
    .insert({
      project_id: projectId,
      proposer_id: userId,
      motion_type: "pool_amount",
      payload: { year_month: yearMonth, pool_amount: poolAmount },
      status: "pending",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("shareholder_motion_votes").insert({
    motion_id: (motion as { id: string }).id,
    voter_id: userId,
    approved: true,
  });

  return NextResponse.json(motion);
}
