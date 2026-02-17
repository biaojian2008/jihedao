-- 用户屏蔽：屏蔽后该用户不在成员列表显示，其帖子也不在社区列表显示
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, blocked_user_id)
);
create index if not exists idx_user_blocks_user on public.user_blocks(user_id);
create index if not exists idx_user_blocks_blocked on public.user_blocks(blocked_user_id);

-- RLS: anon can read/write for MVP (or restrict to own rows)
alter table public.user_blocks enable row level security;
create policy "Users can manage own blocks" on public.user_blocks
  for all using (true) with check (true);
