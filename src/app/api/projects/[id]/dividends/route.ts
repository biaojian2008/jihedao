/**
 * GET: 分红期列表
 * POST: 创建并执行分红 { total_amount } 或录入收益 { action: "add_revenue", revenue_amount }
 */
import { NextRequest, NextResponse } from "next/server";
import { distributeDividend } from "@/lib/projects/review";
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

  const { data: periods, error } = await supabase
    .from("dividend_periods")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const periodIds = (periods ?? []).map((p) => (p as { id: string }).id);
  const { data: distributions } = periodIds.length
    ? await supabase.from("dividend_distributions").select("*").in("period_id", periodIds)
    : { data: [] };

  return NextResponse.json({ periods: periods ?? [], distributions: distributions ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  let body: { action?: string; total_amount?: number; revenue_amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const actor = await getProjectMember(supabase, projectId, userId);
  if (!actor || actor.status !== "active" || !isShareholder(actor.role)) {
    return NextResponse.json({ error: "仅股东可操作" }, { status: 403 });
  }

  if (body.action === "add_revenue") {
    const amount = Number(body.revenue_amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "revenue_amount 无效" }, { status: 400 });
    }
    const { data: project } = await supabase.from("projects").select("total_revenue").eq("id", projectId).single();
    const current = Number((project as { total_revenue?: number })?.total_revenue ?? 0);
    await supabase
      .from("projects")
      .update({ total_revenue: current + amount, updated_at: new Date().toISOString() })
      .eq("id", projectId);
    return NextResponse.json({ ok: true, total_revenue: current + amount });
  }

  const totalAmount = Number(body.total_amount);
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    return NextResponse.json({ error: "total_amount 无效" }, { status: 400 });
  }

  const { data: period, error } = await supabase
    .from("dividend_periods")
    .insert({ project_id: projectId, total_amount: totalAmount, status: "draft" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const periodId = (period as { id: string }).id;
  const res = await distributeDividend(supabase, periodId);
  if (!res.ok) {
    await supabase.from("dividend_periods").delete().eq("id", periodId);
    return NextResponse.json({ error: res.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, period_id: periodId });
}
