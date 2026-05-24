/**
 * GET: 贡献池详情（含申报、投票状态）
 * POST: 开启盲评 { action: "start_review" }
 */
import { NextRequest, NextResponse } from "next/server";
import { getProjectMember } from "@/lib/projects/motions";
import { isShareholder } from "@/lib/projects/roles";
import { getProfileId, getServiceSupabase, notConfigured } from "@/lib/projects/request";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; poolId: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const { poolId } = await params;
  const userId = getProfileId(request);
  const supabase = getServiceSupabase();

  const { data: pool, error } = await supabase
    .from("monthly_contribution_pools")
    .select("*")
    .eq("id", poolId)
    .single();

  if (error || !pool) return NextResponse.json({ error: "贡献池不存在" }, { status: 404 });

  const { data: submissions } = await supabase
    .from("contribution_submissions")
    .select("*")
    .eq("pool_id", poolId);

  const { data: votes } = await supabase.from("blind_review_votes").select("*").eq("pool_id", poolId);

  const { data: appeals } = await supabase.from("project_appeals").select("*").eq("pool_id", poolId);

  let mySubmission = null;
  let myVotes: unknown[] = [];
  if (userId) {
    mySubmission = (submissions ?? []).find((s) => (s as { user_id: string }).user_id === userId) ?? null;
    myVotes = (votes ?? []).filter((v) => (v as { voter_id: string }).voter_id === userId);
  }

  return NextResponse.json({
    pool,
    submissions: submissions ?? [],
    votes: votes ?? [],
    appeals: appeals ?? [],
    my_submission: mySubmission,
    my_votes: myVotes,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; poolId: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId, poolId } = await params;

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const actor = await getProjectMember(supabase, projectId, userId);
  if (!actor || actor.status !== "active" || !isShareholder(actor.role)) {
    return NextResponse.json({ error: "仅股东可开启盲评" }, { status: 403 });
  }

  const { data: pool } = await supabase
    .from("monthly_contribution_pools")
    .select("*")
    .eq("id", poolId)
    .eq("project_id", projectId)
    .single();

  if (!pool) return NextResponse.json({ error: "贡献池不存在" }, { status: 404 });
  if ((pool as { status: string }).status !== "collecting") {
    return NextResponse.json({ error: "仅申报期可开启盲评" }, { status: 400 });
  }

  if (body.action === "start_review") {
    await supabase
      .from("monthly_contribution_pools")
      .update({ status: "reviewing" })
      .eq("id", poolId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
