/**
 * GET = list comments, POST = add comment
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("comments")
    .select("id, author_id, content, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const authorIds = [...new Set((data ?? []).map((c: { author_id: string }) => c.author_id))];
  let names: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name")
      .in("id", authorIds);
    for (const p of profiles ?? []) {
      names[p.id] = p.display_name ?? "匿名";
    }
  }
  const list = (data ?? []).map((c: { id: string; author_id: string; content: string; created_at: string }) => ({
    id: c.id,
    author_id: c.author_id,
    author_name: names[c.author_id] ?? "匿名",
    content: c.content,
    created_at: c.created_at,
  }));
  return NextResponse.json(list);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  let body: { author_id?: string; content?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const authorId = body.author_id;
  const content = (body.content ?? "").trim();
  if (!authorId || !content) return NextResponse.json({ error: "Missing author_id or content" }, { status: 400 });
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: authorId, content })
    .select("id, author_id, content, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", authorId)
    .single();
  return NextResponse.json({
    ...data,
    author_name: (profile as { display_name?: string } | null)?.display_name ?? "匿名",
  });
}
