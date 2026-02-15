/**
 * 关注 API
 * GET ?userId= 当前用户 → 返回 { following: [...id], followers: [...id] }
 * POST body: { follower_id, following_id } 关注
 * DELETE body: { follower_id, following_id } 取关
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  if (!url || !key) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const supabase = createClient(url, key);
  const [followingRes, followersRes] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", userId),
    supabase.from("follows").select("follower_id").eq("following_id", userId),
  ]);
  const following = (followingRes.data ?? []).map((r) => r.following_id);
  const followers = (followersRes.data ?? []).map((r) => r.follower_id);
  return NextResponse.json({ following, followers });
}

export async function POST(request: NextRequest) {
  if (!url || !key) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  let body: { follower_id: string; following_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { follower_id, following_id } = body;
  if (!follower_id || !following_id || follower_id === following_id) {
    return NextResponse.json({ error: "Need follower_id and following_id, and they must differ" }, { status: 400 });
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("follows").insert({ follower_id, following_id }).select("id").single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, already: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(request: NextRequest) {
  if (!url || !key) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  let body: { follower_id: string; following_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { follower_id, following_id } = body;
  if (!follower_id || !following_id) return NextResponse.json({ error: "Need follower_id and following_id" }, { status: 400 });
  const supabase = createClient(url, key);
  await supabase.from("follows").delete().eq("follower_id", follower_id).eq("following_id", following_id);
  return NextResponse.json({ ok: true });
}
