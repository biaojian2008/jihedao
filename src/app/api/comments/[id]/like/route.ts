/** GET = liked + count, POST = like, DELETE = unlike */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await params;
  const userId = req.nextUrl.searchParams.get("userId");
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);
  const { count, error: countErr } = await supabase
    .from("comment_likes")
    .select("id", { count: "exact", head: true })
    .eq("comment_id", commentId);
  if (countErr) return NextResponse.json({ liked: false, count: 0 });
  let liked = false;
  if (userId) {
    const { data: row } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .maybeSingle();
    liked = !!row;
  }
  return NextResponse.json({ liked, count: count ?? 0 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await params;
  let body: { user_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userId = body.user_id;
  if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);
  const { error } = await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await params;
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);
  const { error } = await supabase
    .from("comment_likes")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
