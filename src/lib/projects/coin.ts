import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordProjectLedger(
  supabase: SupabaseClient,
  opts: {
    projectId: string;
    userId?: string | null;
    amount: number;
    coinType: "investment" | "contribution" | "asset" | "dividend" | "exit";
    reason: string;
    referenceType?: string;
    referenceId?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("project_coin_ledger").insert({
    project_id: opts.projectId,
    user_id: opts.userId ?? null,
    amount: opts.amount,
    coin_type: opts.coinType,
    reason: opts.reason,
    reference_type: opts.referenceType ?? null,
    reference_id: opts.referenceId ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function addInvestmentCoins(
  supabase: SupabaseClient,
  opts: {
    projectId: string;
    userId: string;
    amount: number;
    reason: string;
    referenceId?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  if (opts.amount <= 0) return { ok: false, error: "amount must be positive" };

  const { data: member, error: selErr } = await supabase
    .from("project_members")
    .select("id, investment_coins, role, status")
    .eq("project_id", opts.projectId)
    .eq("user_id", opts.userId)
    .single();

  if (selErr || !member) return { ok: false, error: "member not found" };
  if ((member as { status: string }).status !== "active") return { ok: false, error: "member not active" };

  const current = Number((member as { investment_coins: number }).investment_coins);
  const role = (member as { role: string }).role;
  const newRole = role === "founder" || role === "investor" ? role : "investor";

  const { error: updErr } = await supabase
    .from("project_members")
    .update({
      investment_coins: current + opts.amount,
      role: newRole,
    })
    .eq("project_id", opts.projectId)
    .eq("user_id", opts.userId);

  if (updErr) return { ok: false, error: updErr.message };

  const { data: project } = await supabase
    .from("projects")
    .select("total_assets")
    .eq("id", opts.projectId)
    .single();

  const assets = Number((project as { total_assets?: number })?.total_assets ?? 0);
  await supabase
    .from("projects")
    .update({ total_assets: assets + opts.amount, updated_at: new Date().toISOString() })
    .eq("id", opts.projectId);

  return recordProjectLedger(supabase, {
    projectId: opts.projectId,
    userId: opts.userId,
    amount: opts.amount,
    coinType: "investment",
    reason: opts.reason,
    referenceType: "investment",
    referenceId: opts.referenceId,
  });
}

export async function addContributionCoins(
  supabase: SupabaseClient,
  opts: {
    projectId: string;
    userId: string;
    amount: number;
    reason: string;
    referenceId?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  if (opts.amount <= 0) return { ok: false, error: "amount must be positive" };

  const { data: member, error: selErr } = await supabase
    .from("project_members")
    .select("id, contribution_coins, status")
    .eq("project_id", opts.projectId)
    .eq("user_id", opts.userId)
    .single();

  if (selErr || !member) return { ok: false, error: "member not found" };
  if ((member as { status: string }).status !== "active") return { ok: false, error: "member not active" };

  const current = Number((member as { contribution_coins: number }).contribution_coins);
  const { error: updErr } = await supabase
    .from("project_members")
    .update({ contribution_coins: current + opts.amount })
    .eq("project_id", opts.projectId)
    .eq("user_id", opts.userId);

  if (updErr) return { ok: false, error: updErr.message };

  return recordProjectLedger(supabase, {
    projectId: opts.projectId,
    userId: opts.userId,
    amount: opts.amount,
    coinType: "contribution",
    reason: opts.reason,
    referenceType: "contribution_pool",
    referenceId: opts.referenceId,
  });
}
