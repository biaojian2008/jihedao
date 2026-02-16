/**
 * GET ?handle=xxx&exclude_id=uuid 检查 custom_did 是否可用（未被占用）
 * 返回 { available: boolean }，exclude_id 为当前用户 id 时排除自己
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeCustomDidInput } from "@/lib/did";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json({ available: false }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("handle");
  const excludeId = searchParams.get("exclude_id") ?? "";
  if (!raw || !raw.trim()) {
    return NextResponse.json({ available: false }, { status: 400 });
  }
  const handle = normalizeCustomDidInput(raw);
  if (handle.length < 3) {
    return NextResponse.json({ available: false }, { status: 400 });
  }
  const supabase = createClient(url, key);
  let query = supabase
    .from("user_profiles")
    .select("id")
    .eq("custom_did", handle)
    .limit(1);
  if (excludeId) {
    query = query.neq("id", excludeId);
  }
  const { data } = await query.maybeSingle();
  return NextResponse.json({ available: !data });
}
