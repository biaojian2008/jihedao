-- 济和参谋：RAG 知识库与咨询记录（在 Supabase SQL 编辑器执行本文件或迁移）
create extension if not exists vector;

create table if not exists knowledge_base (
  id uuid default gen_random_uuid() primary key,
  domain text not null,
  content text not null,
  source text,
  embedding vector(1536),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists knowledge_base_embedding_idx on knowledge_base
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create table if not exists consultations (
  id uuid default gen_random_uuid() primary key,
  domain text not null,
  answers jsonb not null,
  result text,
  created_at timestamp default now()
);

create or replace function match_knowledge(
  query_embedding vector(1536),
  match_domain text,
  match_count int
)
returns table(content text, similarity float)
language plpgsql
as $$
begin
  return query
  select
    knowledge_base.content,
    (1 - (knowledge_base.embedding <=> query_embedding))::float as similarity
  from knowledge_base
  where knowledge_base.domain = match_domain
    and knowledge_base.embedding is not null
  order by knowledge_base.embedding <=> query_embedding
  limit match_count;
end;
$$;
