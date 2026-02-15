-- 发布页完善：抵押、参加者冻结、时长、收益、归还、智能合约、参加/退出
-- 在 Supabase Dashboard SQL Editor 中执行

-- 1. posts 表扩展字段
alter table public.posts add column if not exists author_collateral numeric not null default 0 check (author_collateral >= 0);
alter table public.posts add column if not exists participant_freeze numeric not null default 0 check (participant_freeze >= 0);
alter table public.posts add column if not exists expected_duration text default '';
alter table public.posts add column if not exists returns_description text default '';
alter table public.posts add column if not exists repay_when text default '项目完成';
alter table public.posts add column if not exists contract_text text default '';
-- 项目/任务专属：具体做什么（与 content 可并存，content 为简介）
alter table public.posts add column if not exists details text default '';

-- 2. 帖子参与者表（参加者及冻结金额）
create table if not exists public.post_participants (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  frozen_amount numeric not null default 0 check (frozen_amount >= 0),
  status text not null default 'joined' check (status in ('joined', 'exited', 'completed')),
  joined_at timestamptz default now(),
  exited_at timestamptz,
  unique(post_id, user_id)
);
create index if not exists idx_post_participants_post on public.post_participants(post_id);
create index if not exists idx_post_participants_user on public.post_participants(user_id);

-- 3. 确保 user_profiles 有济和币字段（若 schema 较早创建可能缺失）
alter table public.user_profiles add column if not exists jihe_coin_balance numeric not null default 0 check (jihe_coin_balance >= 0);

-- 4. 托管账户（冻结济和币时转入，解冻时转出）
insert into public.user_profiles (id, display_name, credit_score, jihe_coin_balance)
values ('00000000-0000-0000-0000-000000000002'::uuid, '济和托管', 100, 0)
on conflict (id) do nothing;
