/**
 * GET ?topic=xxx 获取情报流
 * 需登录，限流，缓存
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PROFILE_ID_COOKIE } from "@/lib/current-user";
import { fetchAggregatedFeed } from "@/lib/intel/feed-fetcher";
import { DEFAULT_RSS_SOURCES } from "@/lib/intel/rss-whitelist";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 小时
const RATE_MAX = 30; // 每小时最多 30 次

const cache = new Map<string, { data: unknown; expires: number }>();
const rateMap = new Map<string, number[]>();

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

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  let times = rateMap.get(userId) ?? [];
  times = times.filter((t) => now - t < RATE_WINDOW_MS);
  if (times.length >= RATE_MAX) return false;
  times.push(now);
  rateMap.set(userId, times);
  return true;
}

export async function GET(request: NextRequest) {
  if (!url || !serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkRateLimit(userId)) {
    return NextResponse.json({ error: "Rate limit exceeded", hint: "请稍后再试" }, { status: 429 });
  }
  const topicName = request.nextUrl.searchParams.get("topic") ?? "default";
  const keywordsParam = request.nextUrl.searchParams.get("keywords");
  const maxParam = request.nextUrl.searchParams.get("max");
  const cacheKey = `feed:${userId}:${topicName}:${keywordsParam ?? ""}:${maxParam ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const supabase = createClient(url, serviceKey);
  let keywords: string[] = [];
  let maxPerPush = 10;

  if (keywordsParam != null && keywordsParam.trim()) {
    keywords = keywordsParam.split(/[,，\s]+/).map((k) => k.trim()).filter(Boolean).slice(0, 10);
  } else {
    const { data: topicRow } = await supabase
      .from("intel_topics")
      .select("keywords, max_per_push")
      .eq("user_id", userId)
      .eq("topic_name", topicName)
      .single();
    keywords = (topicRow?.keywords as string[]) ?? [];
    maxPerPush = (topicRow?.max_per_push as number) ?? 10;
  }
  const m = parseInt(maxParam ?? "", 10);
  if (!Number.isNaN(m) && m >= 1 && m <= 50) maxPerPush = m;

  let sources = DEFAULT_RSS_SOURCES;
  try {
    const { data: rows } = await supabase
      .from("intel_rss_sources")
      .select("feed_url, name, category")
      .eq("enabled", true);
    if (rows?.length) sources = rows as { feed_url: string; name: string; category?: string }[];
  } catch {
    /* use default */
  }

  const items = await fetchAggregatedFeed(sources, {
    keywords: keywords.length > 0 ? keywords : undefined,
    maxItems: maxPerPush,
  });

  const result = items.map((i) => ({
    title: i.title,
    link: i.link,
    source: i.source,
    pubDate: i.pubDate,
  }));

  cache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL_MS });
  return NextResponse.json(result);
}
