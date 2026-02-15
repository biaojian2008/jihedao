/**
 * 管理后台上传：本地上传文件到 Supabase Storage（bucket: cms），返回公网 URL
 * 需先登录（cookie）或 x-admin-secret
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdmin } from "@/lib/admin-auth";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "cms";

export async function POST(request: NextRequest) {
  if (!checkAdmin(request)) {
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
  const ext = (file.name || "").split(".").pop() || "jpg";
  const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const supabase = createClient(url, serviceKey || key);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (error) {
    const isBucketMissing =
      error.message?.toLowerCase().includes("bucket") && error.message?.toLowerCase().includes("not found");
    const isPolicy =
      error.message?.toLowerCase().includes("row-level security") || error.message?.toLowerCase().includes("policy");
    const hint = isBucketMissing
      ? "请在 Supabase 控制台 → Storage → New bucket 创建名为 cms 的桶，并设为 Public（公开），然后重试上传。"
      : isPolicy
        ? "若报 RLS/策略错误，请在环境变量中配置 SUPABASE_SERVICE_ROLE_KEY（Supabase 项目 Settings → API → service_role）。"
        : "请在 Supabase Dashboard 创建公开 bucket：cms";
    return NextResponse.json(
      { error: error.message, hint },
      { status: 500 }
    );
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
