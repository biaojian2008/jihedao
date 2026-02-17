/**
 * 成员列表 API
 * GET: 返回所有 user_profiles（含 badges），按 display_name
 * ?userId= 时排除被当前用户屏蔽的人（用于「全部」等 tab）
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const userId = request.nextUrl.searchParams.get("userId") || "";
  const supabase = createClient(url, key);

  let blockedIds: string[] = [];
  if (userId) {
    const { data: blocks } = await supabase.from("user_blocks").select("blocked_user_id").eq("user_id", userId);
    blockedIds = (blocks ?? []).map((b) => b.blocked_user_id);
  }

  const { data: profiles, error } = await supabase
    .from("user_profiles")
    .select("id, display_name, bio, avatar_url, fid, custom_did, credit_score, jihe_coin_balance")
    .order("display_name", { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let list = profiles ?? [];
  if (blockedIds.length > 0) list = list.filter((p) => !blockedIds.includes(p.id));

  const ids = list.map((p) => p.id);
  const { data: badgesByUser } = await supabase
    .from("user_badges")
    .select("user_id, name, description, icon_url")
    .in("user_id", ids);
  const badgesMap: Record<string, { name: string; description: string | null; icon_url: string | null }[]> = {};
  for (const b of badgesByUser ?? []) {
    if (!badgesMap[b.user_id]) badgesMap[b.user_id] = [];
    badgesMap[b.user_id].push({ name: b.name, description: b.description, icon_url: b.icon_url });
  }
  const result = list.map((p) => ({
    ...p,
    badges: badgesMap[p.id] ?? [],
  }));
  return NextResponse.json(result);
}
