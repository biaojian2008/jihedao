/**
 * 济和币模拟钱包：发放、查询余额与流水
 * 需使用 service_role 的 Supabase 客户端进行写操作
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** 发放原因枚举，便于统计与展示 */
export const JIHE_COIN_REASONS = {
  POST_CREATE: "发帖",
  COMMENT_CREATE: "评论",
  POST_LIKED: "帖子被点赞",
  TASK_DONE: "任务完成",
  BADGE_ISSUED: "获得勋章",
  SHARE: "分享给好友",
  MANUAL: "管理员发放",
} as const;

/** 各行为发放数量（可后续改为从 cms_config 读取） */
export const JIHE_COIN_RULES: Record<string, number> = {
  [JIHE_COIN_REASONS.POST_CREATE]: 5,
  [JIHE_COIN_REASONS.COMMENT_CREATE]: 2,
  [JIHE_COIN_REASONS.POST_LIKED]: 1,
  [JIHE_COIN_REASONS.TASK_DONE]: 10,
  [JIHE_COIN_REASONS.BADGE_ISSUED]: 20,
  [JIHE_COIN_REASONS.SHARE]: 10,
  [JIHE_COIN_REASONS.MANUAL]: 0, // 由调用方传入
};

export type LedgerRow = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
};

/**
 * 给用户发放济和币（增加余额并记流水）
 * 使用 RPC 或先 update 再 insert；这里用 update 递增 + insert 流水
 */
/**
 * 给用户发放济和币：先读当前余额，再更新余额并写入流水
 */
export async function awardCoins(
  supabase: SupabaseClient,
  opts: {
    userId: string;
    amount: number;
    reason: string;
    referenceType?: string;
    referenceId?: string;
  }
): Promise<{ ok: boolean; newBalance?: number; error?: string }> {
  if (opts.amount <= 0) {
    return { ok: false, error: "amount must be positive" };
  }

  const { data: profile, error: selectErr } = await supabase
    .from("user_profiles")
    .select("jihe_coin_balance")
    .eq("id", opts.userId)
    .single();

  if (selectErr || !profile) {
    return { ok: false, error: selectErr?.message ?? "user not found" };
  }

  const currentBalance = Number((profile as { jihe_coin_balance?: number })?.jihe_coin_balance ?? 0);
  const newBalance = currentBalance + opts.amount;

  const { error: updateErr } = await supabase
    .from("user_profiles")
    .update({ jihe_coin_balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", opts.userId);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  const { error: ledgerErr } = await supabase.from("jihe_coin_ledger").insert({
    user_id: opts.userId,
    amount: opts.amount,
    reason: opts.reason,
    reference_type: opts.referenceType ?? null,
    reference_id: opts.referenceId ?? null,
  });

  if (ledgerErr) {
    return { ok: false, error: ledgerErr.message };
  }
  return { ok: true, newBalance };
}

/** 查询用户济和币余额 */
export async function getBalance(
  supabase: SupabaseClient,
  userId: string
): Promise<{ balance: number; error?: string }> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("jihe_coin_balance")
    .eq("id", userId)
    .single();
  if (error) return { balance: 0, error: error.message };
  return { balance: Number((data as { jihe_coin_balance?: number })?.jihe_coin_balance ?? 0) };
}

/** 济和托管账户 ID，用于冻结/解冻 */
export const ESCROW_USER_ID = "00000000-0000-0000-0000-000000000002";

/** 扣除用户济和币（发布者抵押等） */
export async function deductCoins(
  supabase: SupabaseClient,
  opts: {
    userId: string;
    amount: number;
    reason: string;
    referenceType?: string;
    referenceId?: string;
  }
): Promise<{ ok: boolean; newBalance?: number; error?: string }> {
  if (opts.amount <= 0) {
    return { ok: false, error: "amount must be positive" };
  }

  const { data: profile, error: selectErr } = await supabase
    .from("user_profiles")
    .select("jihe_coin_balance")
    .eq("id", opts.userId)
    .single();

  if (selectErr || !profile) {
    return { ok: false, error: selectErr?.message ?? "user not found" };
  }

  const currentBalance = Number((profile as { jihe_coin_balance?: number })?.jihe_coin_balance ?? 0);
  if (currentBalance < opts.amount) {
    return { ok: false, error: "insufficient balance" };
  }
  const newBalance = currentBalance - opts.amount;

  const { error: updateErr } = await supabase
    .from("user_profiles")
    .update({ jihe_coin_balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", opts.userId);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  const { error: ledgerErr } = await supabase.from("jihe_coin_ledger").insert({
    user_id: opts.userId,
    amount: -opts.amount,
    reason: opts.reason,
    reference_type: opts.referenceType ?? null,
    reference_id: opts.referenceId ?? null,
  });

  if (ledgerErr) {
    return { ok: false, error: ledgerErr.message };
  }
  return { ok: true, newBalance };
}

/** 冻结济和币：从用户转入托管账户 */
export async function freezeCoins(
  supabase: SupabaseClient,
  opts: {
    userId: string;
    amount: number;
    postId: string;
    reason?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  if (opts.amount <= 0) {
    return { ok: false, error: "amount must be positive" };
  }

  const reason = opts.reason ?? "参与帖子冻结";
  const res = await deductCoins(supabase, {
    userId: opts.userId,
    amount: opts.amount,
    reason,
    referenceType: "post_freeze",
    referenceId: opts.postId,
  });
  if (!res.ok) return res;

  await awardCoins(supabase, {
    userId: ESCROW_USER_ID,
    amount: opts.amount,
    reason: `托管: ${reason}`,
    referenceType: "post_freeze",
    referenceId: opts.postId,
  });
  return { ok: true };
}

/** 解冻济和币：从托管账户转回用户 */
export async function releaseCoins(
  supabase: SupabaseClient,
  opts: {
    userId: string;
    amount: number;
    postId: string;
    reason?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  if (opts.amount <= 0) {
    return { ok: false, error: "amount must be positive" };
  }

  const reason = opts.reason ?? "参与帖子解冻";
  const res = await deductCoins(supabase, {
    userId: ESCROW_USER_ID,
    amount: opts.amount,
    reason: `解冻: ${reason}`,
    referenceType: "post_release",
    referenceId: opts.postId,
  });
  if (!res.ok) return res;

  await awardCoins(supabase, {
    userId: opts.userId,
    amount: opts.amount,
    reason,
    referenceType: "post_release",
    referenceId: opts.postId,
  });
  return { ok: true };
}

/** 查询用户济和币流水（最近 N 条） */
export async function getLedger(
  supabase: SupabaseClient,
  userId: string,
  limit = 20
): Promise<{ items: LedgerRow[]; error?: string }> {
  const { data, error } = await supabase
    .from("jihe_coin_ledger")
    .select("id, user_id, amount, reason, reference_type, reference_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { items: [], error: error.message };
  return { items: (data ?? []) as LedgerRow[] };
}
