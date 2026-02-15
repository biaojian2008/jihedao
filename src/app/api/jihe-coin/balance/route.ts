/**
 * 当前用户济和币余额
 * GET：需 cookie jihe_profile_id，返回 { balance: number }
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

export async function GET(request: NextRequest) {
  if (!url || !key) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const userId = getProfileIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("user_profiles")
    .select("jihe_coin_balance")
    .eq("id", userId)
    .single();
  if (error || data == null) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }
  const balance = Number(data.jihe_coin_balance);
  return NextResponse.json({ balance: Number.isFinite(balance) ? balance : 0 });
}
