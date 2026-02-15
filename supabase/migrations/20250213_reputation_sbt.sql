-- 信誉与 SBT 系统
-- 在 Supabase Dashboard SQL Editor 中执行

-- 1. 信誉配置：不同类别的权重
create table if not exists public.reputation_config (
  category text primary key,
  weight numeric not null default 1 check (weight >= 0)
);
insert into public.reputation_config (category, weight) values
  ('Tech', 1.2),
  ('Education', 1.0),
  ('Delivery', 0.8),
  ('default', 1.0)
on conflict (category) do nothing;

-- 2. SBT 记录（带 EIP-712 签名，确保证明不可篡改）
create table if not exists public.sbt_records (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null default gen_random_uuid(),
  issuer_address text not null,
  recipient_address text not null,
  recipient_user_id uuid references public.user_profiles(id) on delete set null,
  metadata jsonb not null default '{}',
  issuer_score_at_mint int not null default 0,
  signature text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_sbt_records_recipient on public.sbt_records(recipient_address);
create index if not exists idx_sbt_records_recipient_user on public.sbt_records(recipient_user_id);
create index if not exists idx_sbt_records_issuer on public.sbt_records(issuer_address);
create index if not exists idx_sbt_records_created on public.sbt_records(created_at desc);
