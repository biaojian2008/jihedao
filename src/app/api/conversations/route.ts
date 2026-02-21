/**
 * 交流会话 API
 * GET ?userId= 当前用户 id，返回其参与的会话列表（含 last_message_preview、对方信息）
 * POST body: { user_id, other_user_id } 创建或获取与 other_user_id 的双人会话
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDisplayNameOrDid } from "@/lib/did";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId" },
      { status: 400 }
    );
  }

  const supabase = createClient(url, key);

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  const convIds = (participants ?? []).map((p) => p.conversation_id);
  if (convIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: convs } = await supabase
    .from("conversations")
    .select("id, last_message_preview, updated_at")
    .in("id", convIds)
    .order("updated_at", { ascending: false });

  const result = await Promise.all(
    (convs ?? []).map(async (c) => {
      const { data: parts } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", c.id);
      const otherId = (parts ?? []).find((p) => p.user_id !== userId)?.user_id;
      let otherName = "未知";
      if (otherId) {
        const { data: prof } = await supabase
          .from("user_profiles")
          .select("id, display_name, fid, custom_did")
          .eq("id", otherId)
          .single();
        otherName = prof ? getDisplayNameOrDid(prof) : getDisplayNameOrDid({ id: otherId });
      }
      return {
        id: c.id,
        last_message_preview: c.last_message_preview,
        updated_at: c.updated_at,
        other_user_id: otherId,
        other_display_name: otherName,
      };
    })
  );
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  let body: { user_id: string; other_user_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { user_id, other_user_id } = body;
  if (!user_id || !other_user_id || user_id === other_user_id) {
    return NextResponse.json(
      { error: "Need user_id and other_user_id, and they must differ" },
      { status: 400 }
    );
  }

  const supabase = createClient(url, key);

  const { data: existing } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user_id);
  const myConvIds = (existing ?? []).map((p) => p.conversation_id);
  if (myConvIds.length > 0) {
    const { data: otherParts } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", other_user_id)
      .in("conversation_id", myConvIds);
    const shared = (otherParts ?? []).find((p) => myConvIds.includes(p.conversation_id));
    if (shared) {
      return NextResponse.json({ id: shared.conversation_id, created: false });
    }
  }

  const { data: newConv, error: insertConvError } = await supabase
    .from("conversations")
    .insert({})
    .select("id")
    .single();
  if (insertConvError) {
    return NextResponse.json({ error: insertConvError.message }, { status: 500 });
  }
  const { error: insertPartsError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: newConv.id, user_id },
      { conversation_id: newConv.id, user_id: other_user_id },
    ]);
  if (insertPartsError) {
    return NextResponse.json({ error: insertPartsError.message }, { status: 500 });
  }
  return NextResponse.json({ id: newConv.id, created: true });
}
