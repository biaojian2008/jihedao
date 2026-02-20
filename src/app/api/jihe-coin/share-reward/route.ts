/**
 * 分享奖励 API
 * POST：分享成功后调用，给当前用户发放 10 济和币（每天限一次）
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PROFILE_ID_COOKIE } from "@/lib/current-user";
import { JIHE_COIN_REASONS, JIHE_COIN_RULES, awardCoins } from "@/lib/jihe-coin";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getProfileIdFromRequest(req: NextRequest): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(new RegExp("(^| )" + PROFILE_ID_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]+)"));
  const v = m?.[2];
  if (v) {
    try {
      return decodeURIComponent(v);
    } catch {
      return null;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!url || !serviceKey) return NextResponse.json({ error: "服务未配置" }, { status: 503 });
  const userId = getProfileIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const supabase = createClient(url, serviceKey);

  // 检查今天是否已领取
  const today = new Date().toISOString().slice(0, 10);
  const { data: ledger } = await supabase
    .from("jihe_coin_ledger")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", JIHE_COIN_REASONS.SHARE)
    .gte("created_at", `${today}T00:00:00`)
    .limit(1);
  if (ledger && ledger.length > 0) {
    return NextResponse.json({ ok: true, already_claimed: true, message: "今日已领取" });
  }

  const amount = JIHE_COIN_RULES[JIHE_COIN_REASONS.SHARE] ?? 10;
  const res = await awardCoins(supabase, {
    userId,
    amount,
    reason: JIHE_COIN_REASONS.SHARE,
    referenceType: "share",
    referenceId: null,
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.error ?? "发放失败" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, amount, new_balance: res.newBalance });
}
