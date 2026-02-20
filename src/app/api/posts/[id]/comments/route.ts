/**
 * GET = list comments (with like/save counts), POST = add comment (supports parent_id)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDisplayNameOrDid } from "@/lib/did";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const userId = request.nextUrl.searchParams.get("userId") ?? "";
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);

  let data: { id: string; author_id: string; content: string; created_at: string; parent_id?: string | null }[] | null = null;
  const { data: dataWithParent, error: errWithParent } = await supabase
    .from("comments")
    .select("id, author_id, content, created_at, parent_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (!errWithParent && dataWithParent) {
    data = dataWithParent as { id: string; author_id: string; content: string; created_at: string; parent_id?: string | null }[];
  } else {
    const { data: dataBase, error: errBase } = await supabase
      .from("comments")
      .select("id, author_id, content, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (errBase) return NextResponse.json({ error: errBase.message }, { status: 500 });
    data = (dataBase ?? []).map((c) => ({ ...c, parent_id: null as string | null }));
  }
  return buildCommentList(supabase, data ?? [], userId);
}

async function buildCommentList(
  supabase: SupabaseClient,
  rows: { id: string; author_id: string; content: string; created_at: string; parent_id?: string | null }[],
  userId: string
) {
  const authorIds = [...new Set(rows.map((c) => c.author_id))];
  let names: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, fid, custom_did")
      .in("id", authorIds);
    for (const p of profiles ?? []) {
      names[p.id] = getDisplayNameOrDid({ id: p.id, display_name: p.display_name, fid: p.fid, custom_did: (p as { custom_did?: string | null }).custom_did });
    }
  }
  const commentIds = rows.map((c) => c.id);
  let likeCounts: Record<string, number> = {};
  let likedSet = new Set<string>();
  let savedSet = new Set<string>();
  try {
    const { data: likeRows } = await supabase.from("comment_likes").select("comment_id").in("comment_id", commentIds);
    for (const r of likeRows ?? []) {
      likeCounts[(r as { comment_id: string }).comment_id] = (likeCounts[(r as { comment_id: string }).comment_id] ?? 0) + 1;
    }
    if (userId) {
      const { data: myLikes } = await supabase.from("comment_likes").select("comment_id").eq("user_id", userId).in("comment_id", commentIds);
      for (const r of myLikes ?? []) {
        likedSet.add((r as { comment_id: string }).comment_id);
      }
      const { data: mySaved } = await supabase.from("saved_comments").select("comment_id").eq("user_id", userId).in("comment_id", commentIds);
      for (const r of mySaved ?? []) {
        savedSet.add((r as { comment_id: string }).comment_id);
      }
    }
  } catch {
    // comment_likes / saved_comments may not exist yet
  }
  return NextResponse.json(
    rows.map((c) => ({
      id: c.id,
      author_id: c.author_id,
      author_name: names[c.author_id] ?? getDisplayNameOrDid({ id: c.author_id }),
      content: c.content,
      created_at: c.created_at,
      parent_id: c.parent_id ?? null,
      like_count: likeCounts[c.id] ?? 0,
      liked: likedSet.has(c.id),
      saved: savedSet.has(c.id),
    }))
  );
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  let body: { author_id?: string; content?: string; parent_id?: string | null } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const authorId = body.author_id;
  const content = (body.content ?? "").trim();
  const parentId = body.parent_id?.trim() || null;
  if (!authorId || !content) return NextResponse.json({ error: "Missing author_id or content" }, { status: 400 });
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);

  const insertPayload: Record<string, unknown> = {
    post_id: postId,
    author_id: authorId,
    content,
  };
  if (parentId) (insertPayload as Record<string, unknown>).parent_id = parentId;
  const { data, error } = await supabase
    .from("comments")
    .insert(insertPayload as { post_id: string; author_id: string; content: string; parent_id?: string | null })
    .select("id, author_id, content, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, display_name, fid, custom_did")
    .eq("id", authorId)
    .single();
  const authorName = profile ? getDisplayNameOrDid({ id: profile.id, display_name: profile.display_name, fid: profile.fid, custom_did: (profile as { custom_did?: string | null }).custom_did }) : getDisplayNameOrDid({ id: authorId });
  return NextResponse.json({
    ...data,
    author_name: authorName,
    parent_id: (data as { parent_id?: string | null })?.parent_id ?? null,
    like_count: 0,
    liked: false,
    saved: false,
  });
}
