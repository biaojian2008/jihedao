-- 生存手册：知识库、审核队列、参谋消息用量追踪
-- 在 Supabase SQL Editor 执行本文件

-- 1. 确保 pgvector 已开启（若已开启不会报错）
create extension if not exists vector;

-- 2. 参谋消息用量追踪（所有参谋类型共享，含生存手册）
create table if not exists canmou_usage (
  user_id text primary key,
  message_count integer not null default 0,
  updated_at timestamp default now()
);

-- 3. 生存手册知识库（独立于现有 knowledge_base，支持全文检索）
create table if not exists survival_knowledge (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  tags text[] default '{}',
  source text,
  embedding vector(1536),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 全文检索索引（中文分词用 pg_trgm）
create extension if not exists pg_trgm;
create index if not exists survival_knowledge_content_trgm
  on survival_knowledge using gin (content gin_trgm_ops);
create index if not exists survival_knowledge_title_trgm
  on survival_knowledge using gin (title gin_trgm_ops);

-- 向量检索索引（可选，embeddings 入库后启用）
create index if not exists survival_knowledge_embedding_idx
  on survival_knowledge using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- 4. 生存手册知识库审核队列
create table if not exists survival_pending (
  id uuid default gen_random_uuid() primary key,
  raw_input text not null,           -- 用户提交的原始内容（URL 或文本）
  input_type text not null default 'text', -- 'url' | 'text'
  ai_title text,                     -- AI 提取的标题
  ai_summary text,                   -- AI 生成的摘要
  ai_tags text[] default '{}',       -- AI 建议的标签
  relevance_score integer default 0, -- AI 相关度评分 0-100
  status text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  reviewed_at timestamp,
  created_at timestamp default now()
);

-- 5. 生存手册全文检索函数
create or replace function search_survival_knowledge(
  query_text text,
  match_count int default 5
)
returns table(id uuid, title text, content text, tags text[], similarity float)
language plpgsql
as $$
begin
  return query
  select
    sk.id,
    sk.title,
    sk.content,
    sk.tags,
    greatest(
      similarity(sk.content, query_text),
      similarity(sk.title, query_text)
    )::float as similarity
  from survival_knowledge sk
  where
    sk.content % query_text
    or sk.title % query_text
    or sk.content ilike '%' || query_text || '%'
  order by similarity desc
  limit match_count;
end;
$$;

-- 6. 原有 knowledge_base 表补充 survival 域支持（如已存在则跳过）
-- 无需额外操作，knowledge_base.domain 字段支持任意值
