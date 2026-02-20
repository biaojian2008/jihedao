/**
 * GET = check saved, POST = save, DELETE = unsave
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ saved: false });
  if (!url || !key) return NextResponse.json({ saved: false });
  const supabase = createClient(url, key);

  const { data } = await supabase
    .from("saved_comments")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();
  return NextResponse.json({ saved: !!data });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await params;
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

  const { error } = await supabase.from("saved_comments").insert({ comment_id: commentId, user_id: userId });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await params;
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);

  const { error } = await supabase
    .from("saved_comments")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
