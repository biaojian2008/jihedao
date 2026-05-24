import type { SupabaseClient } from "@supabase/supabase-js";
import { memberTotalCoins } from "./roles";
import { recordProjectLedger } from "./coin";

export async function exitProjectMember(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<{ ok: boolean; payout?: number; error?: string }> {
  const { data: member, error: mErr } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  if (mErr || !member) return { ok: false, error: "非项目成员" };
  if ((member as { status: string }).status !== "active") return { ok: false, error: "已退出" };

  const { data: project } = await supabase
    .from("projects")
    .select("total_assets")
    .eq("id", projectId)
    .single();

  const totalAssets = Number((project as { total_assets?: number })?.total_assets ?? 0);

  const { data: allMembers } = await supabase
    .from("project_members")
    .select("investment_coins, contribution_coins, status")
    .eq("project_id", projectId)
    .eq("status", "active");

  let coinSum = 0;
  for (const m of allMembers ?? []) {
    coinSum += memberTotalCoins(m as { investment_coins: number; contribution_coins: number });
  }

  const myCoins = memberTotalCoins(member as { investment_coins: number; contribution_coins: number });
  if (coinSum <= 0 || myCoins <= 0) return { ok: false, error: "无可分配份额" };

  const payout = Math.round((myCoins / coinSum) * totalAssets * 100) / 100;

  await supabase
    .from("project_members")
    .update({
      status: "exited",
      exited_at: new Date().toISOString(),
      investment_coins: 0,
      contribution_coins: 0,
    })
    .eq("project_id", projectId)
    .eq("user_id", userId);

  await supabase
    .from("projects")
    .update({
      total_assets: Math.max(0, totalAssets - payout),
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  await recordProjectLedger(supabase, {
    projectId,
    userId,
    amount: -payout,
    coinType: "exit",
    reason: "成员退出按资产比例结算",
    referenceType: "exit",
    referenceId: userId,
  });

  return { ok: true, payout };
}
