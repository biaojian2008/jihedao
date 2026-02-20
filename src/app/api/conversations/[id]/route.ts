/**
 * GET 会话详情（含对方用户 id、昵称）
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDisplayNameOrDid } from "@/lib/did";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const { id: conversationId } = await context.params;
  const supabase = createClient(url, key);
  const { data: participants, error } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const userIds = (participants ?? []).map((p) => p.user_id);
  if (userIds.length < 2) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, display_name, fid, custom_did")
    .in("id", userIds);
  const names: Record<string, string> = {};
  for (const p of profiles ?? []) {
    names[p.id] = getDisplayNameOrDid({ id: p.id, display_name: p.display_name, fid: p.fid, custom_did: (p as { custom_did?: string | null }).custom_did });
  }
  return NextResponse.json({
    id: conversationId,
    participant_ids: userIds,
    participant_names: names,
  });
}
