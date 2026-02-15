/**
 * 济和币转账 API
 * POST body: { to_user_id: string, amount: number }
 * 从当前登录用户（cookie jihe_profile_id）扣减 amount，转入 to_user_id；写入流水。
 * 依赖 Supabase 函数 transfer_jihe_coin
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PROFILE_ID_COOKIE } from "@/lib/current-user";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
  if (!url || !key) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const fromId = getProfileIdFromRequest(request);
  if (!fromId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  let body: { to_user_id?: string; amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const toUserId = body.to_user_id;
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  if (!toUserId || typeof toUserId !== "string") {
    return NextResponse.json({ error: "缺少 to_user_id" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "金额必须大于 0" }, { status: 400 });
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase.rpc("transfer_jihe_coin", {
    p_from_id: fromId,
    p_to_id: toUserId,
    p_amount: amount,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const result = data as { ok?: boolean; error?: string } | null;
  if (!result || !result.ok) {
    const msg = result?.error ?? "转账失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true, transfer_id: (result as { transfer_id?: string }).transfer_id });
}
