-- 情报筛选+推送模块
-- 用户主题设置：topic + 关键词（每 topic 最多 10 个）
create table if not exists public.intel_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  topic_name text not null,
  keywords text[] not null default '{}',
  max_per_push int not null default 10 check (max_per_push >= 1 and max_per_push <= 50),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, topic_name)
);
create index if not exists idx_intel_topics_user on public.intel_topics(user_id);

-- RSS 白名单（服务端维护，用户不可改）
create table if not exists public.intel_rss_sources (
  id uuid primary key default gen_random_uuid(),
  feed_url text not null unique,
  name text not null,
  category text default 'general',
  enabled boolean not null default true,
  created_at timestamptz default now()
);
create index if not exists idx_intel_rss_enabled on public.intel_rss_sources(enabled) where enabled = true;

-- 种子：默认 RSS 白名单
insert into public.intel_rss_sources (feed_url, name, category) values
  ('https://rsshub.app/zaobao/realtime', '联合早报实时', 'news'),
  ('https://rsshub.app/reuters/world', 'Reuters World', 'news'),
  ('https://rsshub.app/bbc/chinese', 'BBC 中文', 'news'),
  ('https://rsshub.app/theverge', 'The Verge', 'tech'),
  ('https://rsshub.app/hackernews', 'Hacker News', 'tech'),
  ('https://rsshub.app/solidot', 'Solidot', 'tech')
on conflict (feed_url) do nothing;
