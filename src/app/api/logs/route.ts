/**
 * 官方日志 API
 * GET: 列表，按时间倒序
 * POST: 新建。鉴权：cookie（/api/admin/login）或 x-admin-secret
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdmin } from "@/lib/admin-auth";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("official_logs")
    .select("id, title, content, date, tags, cover_image_url, created_at")
    .order("date", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  let body: { title: string; content: string; date: string; tags?: string[]; cover_image_url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { title, content, date, tags, cover_image_url } = body;
  if (!title || !content || !date) {
    return NextResponse.json(
      { error: "Missing title, content or date" },
      { status: 400 }
    );
  }
  const supabase = createClient(url, serviceKey || key);
  const { data, error } = await supabase
    .from("official_logs")
    .insert({ title, content, date, tags: tags || [], cover_image_url: cover_image_url || null })
    .select("id, title, date, created_at")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
