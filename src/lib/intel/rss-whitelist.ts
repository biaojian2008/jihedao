/**
 * RSS 白名单：默认源，API 优先从 DB intel_rss_sources 读取
 */
export type RssSource = { feed_url: string; name: string; category?: string };

export const DEFAULT_RSS_SOURCES: RssSource[] = [
  { feed_url: "https://rsshub.app/zaobao/realtime", name: "联合早报", category: "news" },
  { feed_url: "https://rsshub.app/bbc/chinese", name: "BBC 中文", category: "news" },
  { feed_url: "https://rsshub.app/theverge", name: "The Verge", category: "tech" },
  { feed_url: "https://rsshub.app/hackernews", name: "Hacker News", category: "tech" },
  { feed_url: "https://rsshub.app/solidot", name: "Solidot", category: "tech" },
];
