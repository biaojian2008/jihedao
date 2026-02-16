/**
 * 按需翻译：社区内容、个人介绍等用户生成内容不自动翻译。
 * 优先 LibreTranslate（可配置 LIBRETRANSLATE_URL）；失败时回退到 MyMemory 免费 API，保证可用。
 */
import { NextRequest, NextResponse } from "next/server";

const LIBRE_URL = process.env.LIBRETRANSLATE_URL ?? "https://libretranslate.com";
const MAX_TEXT_LENGTH = 5000;
const MYMEMORY_MAX_CHARS = 450; // MyMemory 单次约 500 字节，UTF-8 保守取 450 字符
type Locale = "zh" | "en" | "ja";

const localeToCode: Record<Locale, string> = {
  zh: "zh",
  en: "en",
  ja: "ja",
};

// 简单内存缓存
const cache = new Map<string, string>();
const CACHE_MAX = 500;

function cacheKey(text: string, target: string): string {
  return `${target}:${text.slice(0, 200)}`;
}

/** 粗略判断是否主要为中文 */
function looksLikeZh(s: string): boolean {
  return /[\u4e00-\u9fff]/.test(s);
}
/** 粗略判断是否主要为日文 */
function looksLikeJa(s: string): boolean {
  return /[\u3040-\u309f\u30a0-\u30ff]/.test(s);
}
function guessSourceLang(text: string): string {
  if (looksLikeZh(text)) return "zh";
  if (looksLikeJa(text)) return "ja";
  return "en";
}

/** MyMemory: GET，单次约 500 字节；长文本分段翻译 */
async function translateMyMemory(text: string, target: Locale): Promise<string> {
  const targetCode = localeToCode[target];
  const chunks: string[] = [];
  let offset = 0;
  while (offset < text.length) {
    const chunk = text.slice(offset, offset + MYMEMORY_MAX_CHARS);
    if (!chunk.trim()) break;
    const source = guessSourceLang(chunk);
    if (source === targetCode) {
      chunks.push(chunk);
      offset += chunk.length;
      continue;
    }
    const langpair = `${source}|${targetCode}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${langpair}`;
    const res = await fetch(url).catch(() => null);
    if (!res?.ok) {
      chunks.push(chunk);
      offset += chunk.length;
      continue;
    }
    const data = (await res.json().catch(() => null)) as { responseData?: { translatedText?: string } };
    const translated = data?.responseData?.translatedText;
    chunks.push(typeof translated === "string" ? translated : chunk);
    offset += chunk.length;
  }
  return chunks.join("");
}

/** LibreTranslate 请求 */
async function translateLibre(text: string, target: Locale): Promise<string | null> {
  const targetCode = localeToCode[target];
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
  if (!res?.ok) return null;
  const data = (await res.json().catch(() => null)) as { translatedText?: string };
  const out = data?.translatedText;
  return typeof out === "string" ? out : null;
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

  let translated: string | null = await translateLibre(text, target);
  if (translated === null || translated === "") {
    translated = await translateMyMemory(text, target);
  }
  if (translated === null) {
    translated = "";
  }
  if (cache.size < CACHE_MAX) cache.set(key, translated);
  return NextResponse.json({ translatedText: translated });
}
