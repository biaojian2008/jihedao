/**
 * GET = single post (optional), DELETE = delete post, PATCH = update post (author only)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = createClient(url, key);
  const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single();
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userId = (body.user_id as string) || request.nextUrl.searchParams.get("userId");
  if (!userId || post.author_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = String(body.title).slice(0, 500);
  if (body.content !== undefined) updates.content = String(body.content).slice(0, 10000);
  if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags.slice(0, 20) : [];
  if (body.media_urls !== undefined) updates.media_urls = Array.isArray(body.media_urls) ? body.media_urls : [];
  if (body.details !== undefined) updates.details = String(body.details).slice(0, 5000);
  if (body.returns_description !== undefined) updates.returns_description = String(body.returns_description).slice(0, 2000);
  if (body.expected_duration !== undefined) updates.expected_duration = String(body.expected_duration).slice(0, 200);
  if (body.repay_when !== undefined) updates.repay_when = String(body.repay_when).slice(0, 200);
  if (body.author_collateral !== undefined) updates.author_collateral = Number(body.author_collateral) || 0;
  if (body.participant_freeze !== undefined) updates.participant_freeze = Number(body.participant_freeze) || 0;
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  const admin = serviceKey ? createClient(url, serviceKey) : supabase;
  const { data, error } = await admin.from("posts").update(updates).eq("id", postId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

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
