/**
 * 从 RSS 白名单拉取、聚合、去重、排序
 */
import Parser from "rss-parser";
import type { RssSource } from "./rss-whitelist";

export type IntelItem = {
  title: string;
  link: string;
  source: string;
  pubDate: string | null;
  content?: string; // 正文摘要，用于关键词匹配
};

const parser = new Parser({ timeout: 10000 });

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    return u.origin + u.pathname;
  } catch {
    return url.trim().toLowerCase();
  }
}

function normalizeTitle(t: string): string {
  return t.trim().toLowerCase().replace(/\s+/g, " ");
}

function scoreRelevance(item: IntelItem, keywords: string[]): number {
  if (keywords.length === 0) return 1;
  const text = (
    (item.title || "") +
    " " +
    (item.source || "") +
    " " +
    (item.content || "")
  ).toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    const k = kw.trim().toLowerCase();
    if (k && text.includes(k)) score += 1;
  }
  return score > 0 ? score / keywords.length : 0;
}

export async function fetchAggregatedFeed(
  sources: RssSource[],
  options: {
    keywords?: string[];
    maxItems?: number;
  } = {}
): Promise<IntelItem[]> {
  const { keywords = [], maxItems = 10 } = options;
  const hasKeywords = keywords.some((k) => k.trim().length > 0);
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const items: IntelItem[] = [];

  for (const src of sources) {
    try {
      const feed = await parser.parseURL(src.feed_url);
      const srcName = feed.title || src.name;
      for (const it of feed.items ?? []) {
        const link = it.link?.trim();
        const title = it.title?.trim();
        if (!link || !title) continue;
        const urlKey = normalizeUrl(link);
        const titleKey = normalizeTitle(title);
        if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) continue;
        seenUrls.add(urlKey);
        seenTitles.add(titleKey);
        const pubDate = it.pubDate || it.isoDate || null;
        const itAny = it as { content?: string; contentSnippet?: string; description?: string };
    const rawContent = itAny.content || itAny.contentSnippet || itAny.description || "";
    const content = rawContent.replace(/<[^>]+>/g, " ").slice(0, 2000);
        items.push({
          title,
          link,
          source: srcName,
          pubDate,
          content,
        });
      }
    } catch {
      /* skip failed feed */
    }
  }

  const scored = items.map((item) => ({ item, score: scoreRelevance(item, keywords) }));
  const filtered = hasKeywords ? scored.filter((x) => x.score > 0) : scored;
  filtered.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    const timeA = a.item.pubDate ? new Date(a.item.pubDate).getTime() : 0;
    const timeB = b.item.pubDate ? new Date(b.item.pubDate).getTime() : 0;
    return timeB - timeA;
  });
  return filtered.map((x) => x.item).slice(0, maxItems);
}
