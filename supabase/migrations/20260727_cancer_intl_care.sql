-- 癌症患者国际就医系统：知识库、印度医院库、文献库、咨询记录
-- 在 Supabase SQL Editor 执行本文件。
-- 说明：
--   * embedding 采用 BGE-M3（硅基流动 API）输出的 1024 维向量，独立于现有 knowledge_base(1536)。
--   * 沿用 planner 的「人工签发闸门」：verified=false 的数据不对患者展示。
--   * 版权红线：standard_treatment 等只存「事实摘要 + source_url 指向原文」，不存 NCCN/ESMO 原文。

create extension if not exists vector;

-- ─────────────────────────────────────────────
-- 表 1：癌症诊疗指南知识库
-- ─────────────────────────────────────────────
create table if not exists cancer_guidelines (
  id uuid default gen_random_uuid() primary key,
  cancer_type text not null,               -- 癌症类型，如「非小细胞肺癌」
  subtype text,                            -- 亚型，如「EGFR Exon20ins 突变」
  stage text,                              -- 分期 I–IV / 局部晚期 / 转移性 等
  source text not null,                    -- 来源机构：NCCN / ESMO / CSCO / PubMed
  source_url text,                         -- 指向原文的链接（不存原文正文）
  standard_treatment text,                 -- 标准治疗方案（人工整理的事实摘要）
  survival_data jsonb default '{}'::jsonb, -- 存活率数据，如 {"5y_os":"..."}
  china_availability text,                 -- 中国可及性/成本备注
  india_availability text,                 -- 印度可及性/成本备注
  embedding vector(1024),                  -- BGE-M3 向量（语义检索用）
  verified boolean not null default false, -- 人工签发闸门
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists cancer_guidelines_type_idx
  on cancer_guidelines (cancer_type);
create index if not exists cancer_guidelines_embedding_idx
  on cancer_guidelines using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- ─────────────────────────────────────────────
-- 表 2：医学文献库（PubMed E-utilities 合法拉取）
-- ─────────────────────────────────────────────
create table if not exists medical_literature (
  id uuid default gen_random_uuid() primary key,
  pubmed_id text unique,                   -- PubMed 文献 ID
  title text not null,
  abstract text,                           -- 摘要
  cancer_type text,
  treatment_keywords text[] default '{}',
  publication_date date,
  source_url text,                         -- 指向 PubMed 原文
  embedding vector(1024),
  created_at timestamptz default now()
);

create index if not exists medical_literature_type_idx
  on medical_literature (cancer_type);
create index if not exists medical_literature_embedding_idx
  on medical_literature using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- ─────────────────────────────────────────────
-- 表 3：印度肿瘤医院库
-- ─────────────────────────────────────────────
create table if not exists india_hospitals (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  city text,
  jci_accredited boolean default false,
  specialties text[] default '{}',         -- 擅长癌症类型
  cost_range jsonb default '{}'::jsonb,     -- 各类治疗费用区间
  reputation_score numeric,                 -- 综合口碑评分（人工录入 0–10）
  source_reviews jsonb default '[]'::jsonb, -- 口碑来源摘要（标注来源，非爬取）
  intl_patient_contact text,                -- 国际患者部联系方式
  source_url text,                          -- 医院官网/信源
  verified boolean not null default false,  -- 人工核实闸门：true 才对患者展示
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists india_hospitals_verified_idx
  on india_hospitals (verified);

-- ─────────────────────────────────────────────
-- 表 4：癌症咨询记录（去隐私化，用于优化）
-- ─────────────────────────────────────────────
create table if not exists cancer_consultations (
  id uuid default gen_random_uuid() primary key,
  user_id text,
  client_token text,
  cancer_type text,
  stage text,
  input_summary text,                       -- 患者输入摘要（去隐私化）
  parsed jsonb default '{}'::jsonb,          -- 结构化解析结果
  screening_result text,                     -- 中立评估正文
  recommended_hospitals uuid[] default '{}', -- 推荐医院 id
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- RPC 1：指南向量检索（1024 维，按癌种可选过滤）
-- ─────────────────────────────────────────────
create or replace function match_cancer_guidelines(
  query_embedding vector(1024),
  match_count int default 5,
  filter_cancer_type text default null
)
returns table(
  id uuid,
  cancer_type text,
  subtype text,
  stage text,
  source text,
  source_url text,
  standard_treatment text,
  survival_data jsonb,
  china_availability text,
  india_availability text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    g.id, g.cancer_type, g.subtype, g.stage, g.source, g.source_url,
    g.standard_treatment, g.survival_data, g.china_availability, g.india_availability,
    (1 - (g.embedding <=> query_embedding))::float as similarity
  from cancer_guidelines g
  where g.verified = true
    and g.embedding is not null
    and (filter_cancer_type is null or g.cancer_type = filter_cancer_type)
  order by g.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ─────────────────────────────────────────────
-- RPC 2：文献向量检索（1024 维）
-- ─────────────────────────────────────────────
create or replace function match_literature(
  query_embedding vector(1024),
  match_count int default 5,
  filter_cancer_type text default null
)
returns table(
  id uuid,
  pubmed_id text,
  title text,
  abstract text,
  source_url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    l.id, l.pubmed_id, l.title, l.abstract, l.source_url,
    (1 - (l.embedding <=> query_embedding))::float as similarity
  from medical_literature l
  where l.embedding is not null
    and (filter_cancer_type is null or l.cancer_type = filter_cancer_type)
  order by l.embedding <=> query_embedding
  limit match_count;
end;
$$;
