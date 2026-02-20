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
  { feed_url: "https://rsshub.app/36kr/news/flash", name: "36氪快讯", category: "chinese" },
  { feed_url: "https://rsshub.app/geekpark/breaking", name: "极客公园", category: "chinese" },
  { feed_url: "https://rsshub.app/sspai/index", name: "少数派", category: "chinese" },
  { feed_url: "https://rsshub.app/zhihu/daily", name: "知乎每日精选", category: "chinese" },
  { feed_url: "https://rsshub.app/v2ex/topics/latest", name: "V2EX 最新", category: "chinese" },
  { feed_url: "https://rsshub.app/ruanyifeng/blog", name: "阮一峰博客", category: "chinese" },
  { feed_url: "https://rsshub.app/ifanr/app", name: "爱范儿", category: "chinese" },
  { feed_url: "https://rsshub.app/infzm/2", name: "南方周末", category: "chinese" },
];
