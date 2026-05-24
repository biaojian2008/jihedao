-- JIHEDAO 项目协作模块（独立项目内账本，与平台 jihe_coin_balance 分离）

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.user_profiles(id) on delete restrict,
  title text not null,
  description text not null default '',
  rules_text text not null default '',
  total_assets numeric not null default 0 check (total_assets >= 0),
  total_revenue numeric not null default 0 check (total_revenue >= 0),
  status text not null default 'active' check (status in ('active', 'archived', 'dissolved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_projects_founder on public.projects(founder_id);
create index if not exists idx_projects_status on public.projects(status);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role text not null check (role in ('founder', 'investor', 'contributor', 'temporary')),
  investment_coins numeric not null default 0 check (investment_coins >= 0),
  contribution_coins numeric not null default 0 check (contribution_coins >= 0),
  status text not null default 'active' check (status in ('active', 'exited')),
  joined_at timestamptz default now(),
  exited_at timestamptz,
  unique(project_id, user_id)
);

create index if not exists idx_project_members_project on public.project_members(project_id);
create index if not exists idx_project_members_user on public.project_members(user_id);

create table if not exists public.project_coin_ledger (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete set null,
  amount numeric not null,
  coin_type text not null check (coin_type in ('investment', 'contribution', 'asset', 'motion', 'dividend', 'exit')),
  reason text not null,
  reference_type text,
  reference_id text,
  created_at timestamptz default now()
);

create index if not exists idx_project_coin_ledger_project on public.project_coin_ledger(project_id);
create index if not exists idx_project_coin_ledger_user on public.project_coin_ledger(user_id);

create table if not exists public.monthly_contribution_pools (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  year_month text not null,
  pool_amount numeric not null default 0 check (pool_amount >= 0),
  status text not null default 'draft' check (status in (
    'draft', 'collecting', 'reviewing', 'appeal', 'settled', 'appeal_settled'
  )),
  review_round integer not null default 1 check (review_round in (1, 2)),
  review_closed_at timestamptz,
  appeal_deadline timestamptz,
  created_at timestamptz default now(),
  unique(project_id, year_month)
);

create index if not exists idx_monthly_pools_project on public.monthly_contribution_pools(project_id);

create table if not exists public.contribution_submissions (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.monthly_contribution_pools(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  description text not null,
  created_at timestamptz default now(),
  unique(pool_id, user_id)
);

create table if not exists public.blind_review_votes (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.monthly_contribution_pools(id) on delete cascade,
  voter_id uuid not null references public.user_profiles(id) on delete cascade,
  target_id uuid not null references public.user_profiles(id) on delete cascade,
  points integer not null check (points >= 1 and points <= 50),
  round integer not null default 1 check (round in (1, 2)),
  created_at timestamptz default now(),
  unique(pool_id, voter_id, target_id, round),
  constraint blind_review_no_self_vote check (voter_id != target_id)
);

create index if not exists idx_blind_review_pool on public.blind_review_votes(pool_id);

create table if not exists public.project_appeals (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.monthly_contribution_pools(id) on delete cascade,
  initiator_id uuid not null references public.user_profiles(id) on delete cascade,
  reason text not null,
  co_signer_ids uuid[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'settled')),
  created_at timestamptz default now()
);

create table if not exists public.shareholder_motions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  proposer_id uuid not null references public.user_profiles(id) on delete cascade,
  motion_type text not null check (motion_type in ('pool_amount', 'rules_change')),
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

create table if not exists public.shareholder_motion_votes (
  id uuid primary key default gen_random_uuid(),
  motion_id uuid not null references public.shareholder_motions(id) on delete cascade,
  voter_id uuid not null references public.user_profiles(id) on delete cascade,
  approved boolean not null,
  created_at timestamptz default now(),
  unique(motion_id, voter_id)
);

create table if not exists public.dividend_periods (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  total_amount numeric not null check (total_amount >= 0),
  status text not null default 'draft' check (status in ('draft', 'distributed')),
  created_at timestamptz default now()
);

create table if not exists public.dividend_distributions (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.dividend_periods(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  share_ratio numeric not null check (share_ratio >= 0),
  created_at timestamptz default now(),
  unique(period_id, user_id)
);
