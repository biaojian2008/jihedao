/**
 * GET: 通过邀请码加入群组
 * 返回 group_id，前端跳转到 /groups/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PROFILE_ID_COOKIE } from "@/lib/current-user";

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
  { params }: { params: Promise<{ code: string }> }
) {
  if (!url || !serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(_request);
  if (!userId) return NextResponse.json({ error: "Unauthorized", hint: "请先登录" }, { status: 401 });

  const { code } = await params;
  if (!code) return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });

  const supabase = createClient(url, serviceKey);

  const { data: invite, error: invErr } = await supabase
    .from("group_invites")
    .select("group_id, expires_at")
    .eq("invite_code", code)
    .single();
  if (invErr || !invite) return NextResponse.json({ error: "Invite not found or expired" }, { status: 404 });

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: invite.group_id, user_id: userId, role: "member" });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ group_id: invite.group_id, already_member: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ group_id: invite.group_id, joined: true });
}
