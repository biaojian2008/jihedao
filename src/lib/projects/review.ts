import type { SupabaseClient } from "@supabase/supabase-js";
import { getDisplayNameOrDid } from "@/lib/did";
import type { BlindReviewVoteInput } from "./types";
import { addContributionCoins } from "./coin";
import { memberTotalCoins } from "./roles";

export function validateBlindReviewVotes(
  votes: BlindReviewVoteInput[],
  voterId: string,
  eligibleTargetIds: string[]
): { ok: true } | { ok: false; error: string } {
  if (votes.length === 0) return { ok: false, error: "至少需要给一个成员投票" };
  const eligible = new Set(eligibleTargetIds);
  let total = 0;
  const seen = new Set<string>();
  for (const v of votes) {
    if (v.target_id === voterId) return { ok: false, error: "不能给自己投票" };
    if (!eligible.has(v.target_id)) return { ok: false, error: "投票目标无效" };
    if (seen.has(v.target_id)) return { ok: false, error: "不能给同一人重复投票" };
    seen.add(v.target_id);
    const pts = Number(v.points);
    if (!Number.isInteger(pts) || pts < 1 || pts > 50) {
      return { ok: false, error: "每人票数须在 1–50 之间" };
    }
    total += pts;
  }
  if (total !== 100) return { ok: false, error: "必须投完 100 贡献点" };
  return { ok: true };
}

export async function settleBlindReview(
  supabase: SupabaseClient,
  poolId: string,
  round: number
): Promise<{ ok: boolean; error?: string }> {
  const { data: pool, error: poolErr } = await supabase
    .from("monthly_contribution_pools")
    .select("id, project_id, pool_amount")
    .eq("id", poolId)
    .single();

  if (poolErr || !pool) return { ok: false, error: "pool not found" };

  const projectId = (pool as { project_id: string }).project_id;
  const poolAmount = Number((pool as { pool_amount: number }).pool_amount);
  if (poolAmount <= 0) return { ok: false, error: "贡献池金额须大于 0" };

  const { data: votes } = await supabase
    .from("blind_review_votes")
    .select("target_id, points, voter_id")
    .eq("pool_id", poolId)
    .eq("round", round);

  const voteRows = votes ?? [];
  if (voteRows.length === 0) return { ok: false, error: "尚无投票" };

  const voterIds = [...new Set(voteRows.map((v) => (v as { voter_id: string }).voter_id))];
  if (voterIds.length < 3) return { ok: false, error: "盲评至少需要 3 人参与" };

  const totals: Record<string, number> = {};
  let grandTotal = 0;
  for (const v of voteRows) {
    const tid = (v as { target_id: string }).target_id;
    const pts = Number((v as { points: number }).points);
    totals[tid] = (totals[tid] ?? 0) + pts;
    grandTotal += pts;
  }
  if (grandTotal <= 0) return { ok: false, error: "总票数为 0" };

  for (const [userId, pts] of Object.entries(totals)) {
    const share = (pts / grandTotal) * poolAmount;
    const rounded = Math.round(share * 100) / 100;
    if (rounded <= 0) continue;
    const res = await addContributionCoins(supabase, {
      projectId,
      userId,
      amount: rounded,
      reason: `月度贡献池盲评结算（第${round}轮）`,
      referenceId: poolId,
    });
    if (!res.ok) return res;
  }

  const finalStatus = round === 2 ? "appeal_settled" : "appeal";
  const updates: Record<string, unknown> = {
    status: finalStatus,
    review_closed_at: new Date().toISOString(),
  };
  if (round === 1) {
    updates.appeal_deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  }

  await supabase.from("monthly_contribution_pools").update(updates).eq("id", poolId);
  return { ok: true };
}

export async function distributeDividend(
  supabase: SupabaseClient,
  periodId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: divRow, error: divErr } = await supabase
    .from("dividend_periods")
    .select("id, project_id, total_amount, status")
    .eq("id", periodId)
    .single();

  if (divErr || !divRow) return { ok: false, error: "分红期不存在" };
  const row = divRow as { id: string; project_id: string; total_amount: number; status: string };
  if (row.status === "distributed") return { ok: false, error: "已分红" };

  const projectId = row.project_id;
  const totalAmount = Number(row.total_amount);
  if (totalAmount <= 0) return { ok: false, error: "分红总额须大于 0" };

  const { data: members } = await supabase
    .from("project_members")
    .select("user_id, investment_coins, contribution_coins, status")
    .eq("project_id", projectId)
    .eq("status", "active");

  const active = members ?? [];
  let coinSum = 0;
  for (const m of active) {
    coinSum += memberTotalCoins(m as { investment_coins: number; contribution_coins: number });
  }
  if (coinSum <= 0) return { ok: false, error: "无有效成员份额" };

  const { data: project } = await supabase
    .from("projects")
    .select("total_revenue")
    .eq("id", projectId)
    .single();

  const revenue = Number((project as { total_revenue?: number })?.total_revenue ?? 0);
  if (totalAmount > revenue) return { ok: false, error: "分红总额不能超过项目累计收益" };

  for (const m of active) {
    const uid = (m as { user_id: string }).user_id;
    const share = memberTotalCoins(m as { investment_coins: number; contribution_coins: number }) / coinSum;
    const amount = Math.round(totalAmount * share * 100) / 100;
    if (amount <= 0) continue;
    await supabase.from("dividend_distributions").insert({
      period_id: periodId,
      user_id: uid,
      amount,
      share_ratio: share,
    });
  }

  await supabase
    .from("projects")
    .update({ total_revenue: revenue - totalAmount, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  await supabase.from("dividend_periods").update({ status: "distributed" }).eq("id", periodId);
  return { ok: true };
}

export async function enrichMemberNames(
  supabase: SupabaseClient,
  members: { user_id: string; investment_coins?: number; contribution_coins?: number; [key: string]: unknown }[]
) {
  if (members.length === 0) return [];
  const ids = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, display_name, fid, custom_did")
    .in("id", ids);

  const nameMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    nameMap[(p as { id: string }).id] = getDisplayNameOrDid(p as Parameters<typeof getDisplayNameOrDid>[0]);
  }

  return members.map((m) => ({
    ...m,
    display_name: nameMap[m.user_id] ?? m.user_id.slice(0, 8),
    total_coins: Number(m.investment_coins ?? 0) + Number(m.contribution_coins ?? 0),
  }));
}
