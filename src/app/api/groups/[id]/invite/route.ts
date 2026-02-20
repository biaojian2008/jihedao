/** POST: 生成邀请链接 或 直接邀请 body: { invitee_id? } */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
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

function generateCode(): string {
  return randomBytes(8).toString("base64url").replace(/[-_]/g, (c) => (c === "-" ? "x" : "y"));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!url || !serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;
  let body: { invitee_id?: string } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    /* ignore */
  }

  const supabase = createClient(url, serviceKey);

  const { data: myMember } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();
  if (!myMember || (myMember.role !== "owner" && myMember.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const inviteeId = body.invitee_id ?? null;

  if (inviteeId) {
    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: inviteeId, role: "member" });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Already a member" }, { status: 400 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, joined: true, user_id: inviteeId });
  }

  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase
    .from("group_invites")
    .insert({ group_id: groupId, inviter_id: userId, invite_code: code, expires_at: expiresAt.toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const base = request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? "https";
  const joinUrl = `${protocol}://${base}/groups/join/${code}`;

  return NextResponse.json({ ok: true, invite_code: code, join_url: joinUrl, expires_at: expiresAt.toISOString() });
}
