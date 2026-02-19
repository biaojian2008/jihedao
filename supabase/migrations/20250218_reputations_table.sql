-- 若某处 SQL 引用了 public.reputations，则创建该表以避免 42P01
-- 应用主要使用 reputation_config + sbt_records；此表可作为缓存或兼容用

create table if not exists public.reputations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  address text,
  score numeric not null default 0,
  updated_at timestamptz default now()
);
create index if not exists idx_reputations_user on public.reputations(user_id);
create index if not exists idx_reputations_address on public.reputations(address);

comment on table public.reputations is 'Optional reputation cache; main logic uses reputation_config + sbt_records.';
