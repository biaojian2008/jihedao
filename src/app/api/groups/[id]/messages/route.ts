/**
 * GET: 群消息列表
 * POST: 发送消息 body: { sender_id, content }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PROFILE_ID_COOKIE } from "@/lib/current-user";
import { getDisplayNameOrDid } from "@/lib/did";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getProfileId(req: NextRequest): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(new RegExp("(^| )" + PROFILE_ID_COOKIE + "=([^;]+)"));
  const v = m?.[2];
  if (v) {
    try {
      return decodeURIComponent(v);
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!url || !serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(_request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await context.params;
  const supabase = createClient(url, serviceKey);

  const { data: member } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data, error } = await supabase
    .from("group_messages")
    .select("id, sender_id, content, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const senders = [...new Set((data ?? []).map((m) => m.sender_id))];
  let names: Record<string, string> = {};
  if (senders.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, fid, custom_did")
      .in("id", senders);
    for (const p of profiles ?? []) {
      names[p.id] = getDisplayNameOrDid(p);
    }
  }
  const list = (data ?? []).map((m) => ({
    ...m,
    sender_name: names[m.sender_id] ?? getDisplayNameOrDid({ id: m.sender_id }),
  }));
  return NextResponse.json(list);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!url || !serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await context.params;
  let body: { sender_id: string; content: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { sender_id, content } = body;
  if (!sender_id || typeof content !== "string") {
    return NextResponse.json({ error: "Missing sender_id or content" }, { status: 400 });
  }
  if (sender_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createClient(url, serviceKey);

  const { data: member } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const preview = content.slice(0, 80).replace(/\n/g, " ");
  const { data: msg, error } = await supabase
    .from("group_messages")
    .insert({ group_id: groupId, sender_id: sender_id, content: content.slice(0, 5000) })
    .select("id, sender_id, content, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from("groups")
    .update({ last_message_preview: preview, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", groupId);

  return NextResponse.json(msg);
}
