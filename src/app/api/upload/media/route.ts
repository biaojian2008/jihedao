/**
 * 发帖/观点配图上传：上传到 Supabase Storage cms/post-media/{profileId}/，返回公网 URL
 * 需 cookie jihe_profile_id
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "cms";
const PROFILE_ID_COOKIE = "jihe_profile_id";

function getProfileId(request: NextRequest): string | null {
  const cookie = request.headers.get("cookie") ?? "";
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
  const profileId = getProfileId(request);
  if (!profileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  }
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const ext = (file.name || "").split(".").pop()?.toLowerCase() || "jpg";
  const allowed = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
  if (!allowed.has(ext)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }
  const path = `post-media/${profileId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const supabase = createClient(url, serviceKey || key);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
