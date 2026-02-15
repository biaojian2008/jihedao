/**
 * 会话消息 API
 * GET: 列表，按时间正序
 * POST: 发送消息 body: { sender_id, content }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  const { id: conversationId } = await params;
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, content, is_encrypted, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const senders = [...new Set((data ?? []).map((m) => m.sender_id))];
  let names: Record<string, string> = {};
  if (senders.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name")
      .in("id", senders);
    for (const p of profiles ?? []) {
      names[p.id] = (p.display_name as string) ?? p.id.slice(0, 8);
    }
  }
  const list = (data ?? []).map((m) => ({
    ...m,
    sender_name: names[m.sender_id] ?? "?",
  }));
  return NextResponse.json(list);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  const { id: conversationId } = await params;
  let body: { sender_id: string; content: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { sender_id, content } = body;
  if (!sender_id || typeof content !== "string") {
    return NextResponse.json(
      { error: "Missing sender_id or content" },
      { status: 400 }
    );
  }

  const supabase = createClient(url, key);
  const preview = content.slice(0, 80).replace(/\n/g, " ");
  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id,
      content: content.slice(0, 5000),
      is_encrypted: false,
    })
    .select("id, sender_id, content, created_at")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await supabase
    .from("conversations")
    .update({
      last_message_preview: preview,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
  return NextResponse.json(msg);
}
