/**
 * POST: 保存 Readwise Token（仅本人）
 * DELETE: 清除个人 Token，恢复使用网站默认
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PROFILE_ID_COOKIE } from "@/lib/current-user";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getProfileIdFromRequest(req: NextRequest): string | null {
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

export async function POST(request: NextRequest) {
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const profileId = getProfileIdFromRequest(request);
  if (!profileId) {
    return NextResponse.json({ error: "Unauthorized", hint: "请先登录" }, { status: 401 });
  }
  let body: { readwise_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const token = typeof body?.readwise_token === "string" ? body.readwise_token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "readwise_token is required" }, { status: 400 });
  }
  const supabase = createClient(url, serviceKey);
  const { error } = await supabase
    .from("user_profiles")
    .update({ readwise_token: token, updated_at: new Date().toISOString() })
    .eq("id", profileId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const profileId = getProfileIdFromRequest(request);
  if (!profileId) {
    return NextResponse.json({ error: "Unauthorized", hint: "请先登录" }, { status: 401 });
  }
  const supabase = createClient(url, serviceKey);
  const { error } = await supabase
    .from("user_profiles")
    .update({ readwise_token: null, updated_at: new Date().toISOString() })
    .eq("id", profileId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
