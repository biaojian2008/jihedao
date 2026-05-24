/**
 * POST: 提交盲评 { votes: [{ target_id, points }] }
 * POST action=close: 股东结算盲评
 */
import { NextRequest, NextResponse } from "next/server";
import { getProjectMember } from "@/lib/projects/motions";
import { isShareholder } from "@/lib/projects/roles";
import { settleBlindReview, validateBlindReviewVotes } from "@/lib/projects/review";
import { getProfileId, getServiceSupabase, notConfigured } from "@/lib/projects/request";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; poolId: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId, poolId } = await params;

  let body: { action?: string; votes?: { target_id: string; points: number }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { data: pool } = await supabase
    .from("monthly_contribution_pools")
    .select("*")
    .eq("id", poolId)
    .eq("project_id", projectId)
    .single();

  if (!pool) return NextResponse.json({ error: "贡献池不存在" }, { status: 404 });

  const poolStatus = (pool as { status: string }).status;
  const round = Number((pool as { review_round?: number }).review_round ?? 1);

  if (body.action === "close") {
    const actor = await getProjectMember(supabase, projectId, userId);
    if (!actor || !isShareholder(actor.role)) {
      return NextResponse.json({ error: "仅股东可结算盲评" }, { status: 403 });
    }
    if (poolStatus !== "reviewing" && !(poolStatus === "appeal" && round === 2)) {
      return NextResponse.json({ error: "当前状态不可结算" }, { status: 400 });
    }
    const res = await settleBlindReview(supabase, poolId, round);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (poolStatus !== "reviewing" && !(poolStatus === "appeal" && round === 2)) {
    return NextResponse.json({ error: "当前不在盲评期" }, { status: 400 });
  }

  const member = await getProjectMember(supabase, projectId, userId);
  if (!member || member.status !== "active") {
    return NextResponse.json({ error: "非项目活跃成员" }, { status: 403 });
  }

  const { data: activeMembers } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("status", "active");

  const eligibleTargets = (activeMembers ?? [])
    .map((m) => (m as { user_id: string }).user_id)
    .filter((id) => id !== userId);

  const votes = body.votes ?? [];
  const validation = validateBlindReviewVotes(votes, userId, eligibleTargets);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  await supabase.from("blind_review_votes").delete().eq("pool_id", poolId).eq("voter_id", userId).eq("round", round);

  const rows = votes.map((v) => ({
    pool_id: poolId,
    voter_id: userId,
    target_id: v.target_id,
    points: v.points,
    round,
  }));

  const { error } = await supabase.from("blind_review_votes").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
