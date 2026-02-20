/**
 * 收藏帖子 API
 * GET ?userId= 当前用户 → 返回收藏的 post id 列表
 * POST body: { user_id, post_id } 收藏
 * DELETE body: { user_id, post_id } 取消收藏
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDisplayNameOrDid } from "@/lib/did";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  const supabase = createClient(url, key);
  const { data: saved } = await supabase
    .from("saved_posts")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!saved?.length) return NextResponse.json([]);
  const postIds = saved.map((r) => r.post_id);
  const { data: postRows } = await supabase
    .from("posts")
    .select("id, author_id, type, title, content, tags, credit_weight, created_at")
    .in("id", postIds);
  const order = postIds;
  const byId = new Map((postRows ?? []).map((p) => [p.id, p]));
  const authorIds = [...new Set((postRows ?? []).map((p) => p.author_id))];
  let profiles: Record<string, { id: string; display_name: string | null; fid: string | null; custom_did: string | null }> = {};
  if (authorIds.length > 0) {
    const { data: profileList } = await supabase
      .from("user_profiles")
      .select("id, display_name, fid, custom_did")
      .in("id", authorIds);
    for (const p of profileList ?? []) {
      profiles[p.id] = { id: p.id, display_name: p.display_name, fid: p.fid ?? null, custom_did: (p as { custom_did?: string | null }).custom_did ?? null };
    }
  }
  const result = order
    .map((id) => {
      const row = byId.get(id);
      if (!row) return null;
      const p = profiles[row.author_id];
      return {
        ...row,
        author_name: p ? getDisplayNameOrDid(p) : getDisplayNameOrDid({ id: row.author_id }),
        saved_at: saved.find((s) => s.post_id === id)?.created_at,
      };
    })
    .filter(Boolean);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  let body: { user_id: string; post_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { user_id, post_id } = body;
  if (!user_id || !post_id) {
    return NextResponse.json({ error: "Need user_id and post_id" }, { status: 400 });
  }
  const supabase = createClient(url, key);
  const { error } = await supabase.from("saved_posts").insert({ user_id, post_id });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, already: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  let body: { user_id: string; post_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { user_id, post_id } = body;
  if (!user_id || !post_id) {
    return NextResponse.json({ error: "Need user_id and post_id" }, { status: 400 });
  }
  const supabase = createClient(url, key);
  await supabase.from("saved_posts").delete().eq("user_id", user_id).eq("post_id", post_id);
  return NextResponse.json({ ok: true });
}
