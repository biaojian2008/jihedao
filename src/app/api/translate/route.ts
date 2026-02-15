/**
 * 按需翻译：社区内容、个人介绍等用户生成内容不自动翻译，通过此接口按用户当前语言翻译。
 * 使用 LibreTranslate 公共实例（可配置 LIBRETRANSLATE_URL），支持 source=auto。
 */
import { NextRequest, NextResponse } from "next/server";

const LIBRE_URL = process.env.LIBRETRANSLATE_URL ?? "https://libretranslate.com";
const MAX_TEXT_LENGTH = 5000;
type Locale = "zh" | "en" | "ja";

const localeToLibre: Record<Locale, string> = {
  zh: "zh",
  en: "en",
  ja: "ja",
};

// 简单内存缓存，避免重复请求（服务重启后清空）
const cache = new Map<string, string>();
const CACHE_MAX = 500;

function cacheKey(text: string, target: string): string {
  return `${target}:${text.slice(0, 200)}`;
}

export async function POST(request: NextRequest) {
  let body: { text?: string; target?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const target = body.target === "en" || body.target === "ja" ? body.target : "zh";
  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text too long (max ${MAX_TEXT_LENGTH})` },
      { status: 400 }
    );
  }

  const key = cacheKey(text, target);
  const cached = cache.get(key);
  if (cached !== undefined) {
    return NextResponse.json({ translatedText: cached });
  }

  const targetCode = localeToLibre[target as Locale] ?? "zh";
  const res = await fetch(`${LIBRE_URL.replace(/\/$/, "")}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: "auto",
      target: targetCode,
      format: "text",
    }),
  }).catch(() => null);

  if (!res?.ok) {
    return NextResponse.json(
      { error: "Translation service unavailable" },
      { status: 502 }
    );
  }

  let data: { translatedText?: string };
  try {
    data = await res.json();
  } catch {
    return NextResponse.json(
      { error: "Translation response invalid" },
      { status: 502 }
    );
  }

  const translated = typeof data?.translatedText === "string" ? data.translatedText : "";
  if (cache.size < CACHE_MAX) cache.set(key, translated);
  return NextResponse.json({ translatedText: translated });
}
