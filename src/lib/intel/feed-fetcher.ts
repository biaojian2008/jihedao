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
  const text = (item.title + " " + (item.source || "")).toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) score += 1;
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
        items.push({
          title,
          link,
          source: srcName,
          pubDate,
        });
      }
    } catch {
      /* skip failed feed */
    }
  }

  items.sort((a, b) => {
    const relA = scoreRelevance(a, keywords);
    const relB = scoreRelevance(b, keywords);
    if (relA !== relB) return relB - relA;
    const timeA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const timeB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return timeB - timeA;
  });

  return items.slice(0, maxItems);
}
