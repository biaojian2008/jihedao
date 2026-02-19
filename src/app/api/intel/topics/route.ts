/**
 * GET: 当前用户的 topics
 * POST: 创建/更新 topic（body: { topic_name, keywords[], max_per_push }）
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

export async function GET(request: NextRequest) {
  if (!url || !serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createClient(url, serviceKey);
  const { data } = await supabase
    .from("intel_topics")
    .select("id, topic_name, keywords, max_per_push")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  if (!url || !serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { topic_name?: string; keywords?: string[]; max_per_push?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const topicName = ((body.topic_name ?? "").trim() || "default").toLowerCase();
  let keywords = Array.isArray(body.keywords) ? body.keywords.filter((k) => typeof k === "string").slice(0, 10) : [];
  const maxPerPush = Math.min(10, Math.max(1, Number(body.max_per_push) || 5));
  const supabase = createClient(url, serviceKey);
  const { error } = await supabase
    .from("intel_topics")
    .upsert(
      { user_id: userId, topic_name: topicName, keywords, max_per_push: maxPerPush, updated_at: new Date().toISOString() },
      { onConflict: "user_id,topic_name" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
