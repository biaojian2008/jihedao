/**
 * GET = single post (optional), DELETE = delete post (author only, use service role)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);
  const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single();
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  const userId = request.nextUrl.searchParams.get("userId") || (await request.json().catch(() => ({})) as { user_id?: string }).user_id;
  if (!userId || post.author_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = serviceKey ? createClient(url, serviceKey) : supabase;
  const { error } = await admin.from("posts").delete().eq("id", postId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
