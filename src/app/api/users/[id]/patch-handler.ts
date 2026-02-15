import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PROFILE_ID_COOKIE } from "@/lib/current-user";
import { validateCustomDidHandle, normalizeCustomDidInput } from "@/lib/did";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

export async function handlePatch(
  request: NextRequest,
  id: string
): Promise<NextResponse> {
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  const currentId = getProfileIdFromRequest(request);
  if (!currentId || currentId !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { display_name?: string; bio?: string; avatar_url?: string; custom_did?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.display_name !== undefined) updates.display_name = body.display_name || null;
  if (body.bio !== undefined) updates.bio = body.bio || null;
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url || null;

  if (body.custom_did !== undefined) {
    const raw = body.custom_did;
    if (raw === null || raw === "") {
      updates.custom_did = null;
    } else {
      const handle = normalizeCustomDidInput(String(raw));
      const valid = validateCustomDidHandle(handle);
      if (!valid.ok) {
        return NextResponse.json({ error: valid.error, code: "INVALID_DID" }, { status: 400 });
      }
      const supabaseCheck = createClient(url, key);
      const { data: existing } = await supabaseCheck
        .from("user_profiles")
        .select("id")
        .eq("custom_did", handle)
        .neq("id", id)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ error: "已占用", code: "DID_TAKEN" }, { status: 409 });
      }
      updates.custom_did = handle;
    }
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", id)
    .select("id, display_name, bio, avatar_url, custom_did")
    .single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "已占用", code: "DID_TAKEN" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
