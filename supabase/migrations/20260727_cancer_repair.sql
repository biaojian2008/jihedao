-- Idempotent repair: recreate any missing cancer tables, backfill any missing
-- columns on partially-created ones, ensure indexes and match functions exist.
-- Pure ASCII (no comments in Chinese) to avoid any encoding issues. Non-destructive.

create extension if not exists vector;

-- Table 1: cancer_guidelines
create table if not exists cancer_guidelines (
  id uuid default gen_random_uuid() primary key,
  cancer_type text not null
);
alter table cancer_guidelines add column if not exists subtype text;
alter table cancer_guidelines add column if not exists stage text;
alter table cancer_guidelines add column if not exists source text;
alter table cancer_guidelines add column if not exists source_url text;
alter table cancer_guidelines add column if not exists standard_treatment text;
alter table cancer_guidelines add column if not exists survival_data jsonb default '{}'::jsonb;
alter table cancer_guidelines add column if not exists china_availability text;
alter table cancer_guidelines add column if not exists india_availability text;
alter table cancer_guidelines add column if not exists embedding vector(1024);
alter table cancer_guidelines add column if not exists verified boolean not null default false;
alter table cancer_guidelines add column if not exists verified_at timestamptz;
alter table cancer_guidelines add column if not exists created_at timestamptz default now();
alter table cancer_guidelines add column if not exists updated_at timestamptz default now();
create index if not exists cancer_guidelines_type_idx on cancer_guidelines (cancer_type);
create index if not exists cancer_guidelines_embedding_idx
  on cancer_guidelines using ivfflat (embedding vector_cosine_ops) with (lists = 50);

-- Table 2: medical_literature
create table if not exists medical_literature (
  id uuid default gen_random_uuid() primary key,
  title text not null
);
alter table medical_literature add column if not exists pubmed_id text;
alter table medical_literature add column if not exists abstract text;
alter table medical_literature add column if not exists cancer_type text;
alter table medical_literature add column if not exists treatment_keywords text[] default '{}';
alter table medical_literature add column if not exists publication_date date;
alter table medical_literature add column if not exists source_url text;
alter table medical_literature add column if not exists embedding vector(1024);
alter table medical_literature add column if not exists created_at timestamptz default now();
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'medical_literature_pubmed_id_key') then
    alter table medical_literature add constraint medical_literature_pubmed_id_key unique (pubmed_id);
  end if;
end $$;
create index if not exists medical_literature_type_idx on medical_literature (cancer_type);
create index if not exists medical_literature_embedding_idx
  on medical_literature using ivfflat (embedding vector_cosine_ops) with (lists = 50);

-- Table 3: india_hospitals
create table if not exists india_hospitals (
  id uuid default gen_random_uuid() primary key,
  name text not null
);
alter table india_hospitals add column if not exists city text;
alter table india_hospitals add column if not exists jci_accredited boolean default false;
alter table india_hospitals add column if not exists specialties text[] default '{}';
alter table india_hospitals add column if not exists cost_range jsonb default '{}'::jsonb;
alter table india_hospitals add column if not exists reputation_score numeric;
alter table india_hospitals add column if not exists source_reviews jsonb default '[]'::jsonb;
alter table india_hospitals add column if not exists intl_patient_contact text;
alter table india_hospitals add column if not exists source_url text;
alter table india_hospitals add column if not exists verified boolean not null default false;
alter table india_hospitals add column if not exists verified_at timestamptz;
alter table india_hospitals add column if not exists created_at timestamptz default now();
alter table india_hospitals add column if not exists updated_at timestamptz default now();
create index if not exists india_hospitals_verified_idx on india_hospitals (verified);

-- Table 4: cancer_consultations
create table if not exists cancer_consultations (
  id uuid default gen_random_uuid() primary key
);
alter table cancer_consultations add column if not exists user_id text;
alter table cancer_consultations add column if not exists client_token text;
alter table cancer_consultations add column if not exists cancer_type text;
alter table cancer_consultations add column if not exists stage text;
alter table cancer_consultations add column if not exists input_summary text;
alter table cancer_consultations add column if not exists parsed jsonb default '{}'::jsonb;
alter table cancer_consultations add column if not exists screening_result text;
alter table cancer_consultations add column if not exists recommended_hospitals uuid[] default '{}';
alter table cancer_consultations add column if not exists created_at timestamptz default now();

-- Enable RLS (access is via service role, which bypasses RLS)
alter table cancer_guidelines enable row level security;
alter table medical_literature enable row level security;
alter table india_hospitals enable row level security;
alter table cancer_consultations enable row level security;

-- RPC 1: guideline vector search (1024-dim)
create or replace function match_cancer_guidelines(
  query_embedding vector(1024),
  match_count int default 5,
  filter_cancer_type text default null
)
returns table(
  id uuid, cancer_type text, subtype text, stage text, source text, source_url text,
  standard_treatment text, survival_data jsonb, china_availability text, india_availability text,
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

-- RPC 2: literature vector search (1024-dim)
create or replace function match_literature(
  query_embedding vector(1024),
  match_count int default 5,
  filter_cancer_type text default null
)
returns table(
  id uuid, pubmed_id text, title text, abstract text, source_url text, similarity float
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
