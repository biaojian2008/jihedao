-- 群组功能
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_groups_created_by on public.groups(created_by);

-- 群成员：owner/admin/member
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);
create index if not exists idx_group_members_group on public.group_members(group_id);
create index if not exists idx_group_members_user on public.group_members(user_id);

-- 群消息：content 支持文本、emoji、图片 URL
create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references public.user_profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);
create index if not exists idx_group_messages_group on public.group_messages(group_id);
create index if not exists idx_group_messages_created on public.group_messages(created_at desc);

-- 群邀请：邀请码或直接邀请
create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  inviter_id uuid not null references public.user_profiles(id) on delete cascade,
  invite_code text unique,
  invitee_id uuid references public.user_profiles(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_group_invites_group on public.group_invites(group_id);
create index if not exists idx_group_invites_code on public.group_invites(invite_code) where invite_code is not null;

-- 群表增加 last_message 便于列表展示
alter table public.groups add column if not exists last_message_preview text;
alter table public.groups add column if not exists last_message_at timestamptz;
