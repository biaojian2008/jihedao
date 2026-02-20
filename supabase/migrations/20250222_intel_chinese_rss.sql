-- 增加中文 RSS 源
insert into public.intel_rss_sources (feed_url, name, category) values
  ('https://rsshub.app/36kr/news/flash', '36氪快讯', 'chinese'),
  ('https://rsshub.app/geekpark/breaking', '极客公园', 'chinese'),
  ('https://rsshub.app/sspai/index', '少数派', 'chinese'),
  ('https://rsshub.app/zhihu/daily', '知乎每日精选', 'chinese'),
  ('https://rsshub.app/v2ex/topics/latest', 'V2EX 最新', 'chinese'),
  ('https://rsshub.app/ruanyifeng/blog', '阮一峰博客', 'chinese'),
  ('https://rsshub.app/ifanr/app', '爱范儿', 'chinese'),
  ('https://rsshub.app/infzm/2', '南方周末', 'chinese')
on conflict (feed_url) do nothing;
