/**
 * POST = add like, DELETE = remove like, GET = check liked + count
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
  const userId = request.nextUrl.searchParams.get("userId");
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);

  const { count, error: countErr } = await supabase
    .from("likes")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);
  if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 });
  let liked = false;
  if (userId) {
    const { data: row } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();
    liked = !!row;
  }
  return NextResponse.json({ liked, count: count ?? 0 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  let body: { user_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userId = body.user_id;
  if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);

  const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: userId });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true }); // already liked
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);

  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
