/**
 * 屏蔽 API
 * GET ?userId= → { blocked: Member[] } 当前用户屏蔽的人（含资料，用于「我屏蔽的」）
 * POST body: { user_id, blocked_user_id } 屏蔽
 * DELETE body: { user_id, blocked_user_id } 取消屏蔽
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const supabase = createClient(url, key);

  const { data: rows } = await supabase
    .from("user_blocks")
    .select("blocked_user_id")
    .eq("user_id", userId);
  const blockedIds = (rows ?? []).map((r) => r.blocked_user_id);
  if (blockedIds.length === 0) return NextResponse.json({ blocked: [] });

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, display_name, bio, avatar_url, fid, custom_did, credit_score, jihe_coin_balance")
    .in("id", blockedIds);
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
  const blocked = (profiles ?? []).map((p) => ({
    ...p,
    badges: badgesMap[p.id] ?? [],
  }));
  return NextResponse.json({ blocked });
}

export async function POST(request: NextRequest) {
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  let body: { user_id: string; blocked_user_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { user_id, blocked_user_id } = body;
  if (!user_id || !blocked_user_id || user_id === blocked_user_id) {
    return NextResponse.json({ error: "Need user_id and blocked_user_id, and they must differ" }, { status: 400 });
  }
  const supabase = createClient(url, key);
  const { error } = await supabase.from("user_blocks").insert({ user_id, blocked_user_id });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, already: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  let body: { user_id: string; blocked_user_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { user_id, blocked_user_id } = body;
  if (!user_id || !blocked_user_id) return NextResponse.json({ error: "Need user_id and blocked_user_id" }, { status: 400 });
  const supabase = createClient(url, key);
  await supabase.from("user_blocks").delete().eq("user_id", user_id).eq("blocked_user_id", blocked_user_id);
  return NextResponse.json({ ok: true });
}
