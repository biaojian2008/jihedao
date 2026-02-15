/**
 * 成员列表 API
 * GET: 返回所有 user_profiles（含 badges），按 display_name
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const supabase = createClient(url, key);
  const { data: profiles, error } = await supabase
    .from("user_profiles")
    .select("id, display_name, bio, avatar_url, fid, custom_did, credit_score, jihe_coin_balance")
    .order("display_name", { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (profiles ?? []).map((p) => p.id);
  const { data: badgesByUser } = await supabase
    .from("user_badges")
    .select("user_id, name, description, icon_url")
    .in("user_id", ids);
  const badgesMap: Record<string, { name: string; description: string | null; icon_url: string | null }[]> = {};
  for (const b of badgesByUser ?? []) {
    if (!badgesMap[b.user_id]) badgesMap[b.user_id] = [];
    badgesMap[b.user_id].push({ name: b.name, description: b.description, icon_url: b.icon_url });
  }
  const result = (profiles ?? []).map((p) => ({
    ...p,
    badges: badgesMap[p.id] ?? [],
  }));
  return NextResponse.json(result);
}
