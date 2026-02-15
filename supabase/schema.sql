-- 济和 DAO - Supabase 表结构 (MVP)
-- 在 Supabase Dashboard SQL Editor 中执行

-- CMS 配置：首页等文案/图片，key-value 存储
create table if not exists public.cms_config (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- 官方日志
create table if not exists public.official_logs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  date date not null,
  tags text[] default '{}',
  cover_image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 用户档案（Privy / 微信登录后创建/更新）
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text unique,
  wechat_openid text unique,
  wallet_address text,
  fid text,
  custom_did text,
  display_name text,
  bio text,
  avatar_url text,
  credit_score int not null default 50,
  jihe_coin_balance numeric not null default 0 check (jihe_coin_balance >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- 非 Farcaster 用户可设置自定义 DID，格式 did:jihe:<custom_did>，需全局唯一
create unique index if not exists user_profiles_custom_did_key on public.user_profiles(custom_did) where custom_did is not null;

-- 济和币流水（模拟钱包）
create table if not exists public.jihe_coin_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  amount numeric not null,
  reason text not null,
  reference_type text,
  reference_id text,
  created_at timestamptz default now()
);
create index if not exists idx_jihe_coin_ledger_user on public.jihe_coin_ledger(user_id);
create index if not exists idx_jihe_coin_ledger_created on public.jihe_coin_ledger(created_at desc);

-- 用户勋章 (SBT 模拟)
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  name text not null,
  icon_url text,
  description text,
  issued_by text,
  issued_at timestamptz default now()
);

-- 帖子（项目/任务/商品/课程/立场）
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.user_profiles(id) on delete cascade,
  type text not null check (type in ('project','task','product','course','stance')),
  title text not null,
  content text not null,
  media_urls text[] default '{}',
  tags text[] default '{}',
  credit_weight int not null default 0,
  onchain_tx_hash text,
  chain text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_posts_author on public.posts(author_id);
create index if not exists idx_posts_created on public.posts(created_at desc);
create index if not exists idx_posts_credit on public.posts(credit_weight desc);

-- 评论
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.user_profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- 点赞
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- 私信：会话
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  last_message_preview text,
  updated_at timestamptz default now()
);

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  unique(conversation_id, user_id)
);

-- 私信：消息
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.user_profiles(id) on delete cascade,
  content text not null,
  is_encrypted boolean not null default false,
  created_at timestamptz default now()
);

-- 关注：follower_id 关注 following_id
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.user_profiles(id) on delete cascade,
  following_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);

-- 收藏帖子（个人中心展示）
create table if not exists public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);
create index if not exists idx_saved_posts_user on public.saved_posts(user_id);

-- 种子：演示用默认用户（用于 NEXT_PUBLIC_DEFAULT_AUTHOR_ID）
insert into public.user_profiles (id, display_name, credit_score)
values ('00000000-0000-0000-0000-000000000001'::uuid, '济和', 85)
on conflict (id) do update set display_name = excluded.display_name, credit_score = excluded.credit_score;

-- RLS 示例：允许匿名读 cms_config 和 official_logs
alter table public.cms_config enable row level security;
alter table public.official_logs enable row level security;

create policy "cms_config read" on public.cms_config for select using (true);
create policy "official_logs read" on public.official_logs for select using (true);

-- 其他表按需加 RLS 与 policy

-- 若已存在 user_profiles 表但无 wechat_openid，可单独执行：
-- alter table public.user_profiles add column if not exists wechat_openid text unique;

-- 若已存在 user_profiles 表但无济和币字段，可单独执行：
-- alter table public.user_profiles add column if not exists jihe_coin_balance numeric not null default 0 check (jihe_coin_balance >= 0);

-- 若已存在 user_profiles 表但无 custom_did，可单独执行：
-- alter table public.user_profiles add column if not exists custom_did text;
-- create unique index if not exists user_profiles_custom_did_key on public.user_profiles(custom_did) where custom_did is not null;

-- 济和币转账（原子操作）：扣减发送方、增加接收方、写入流水
create or replace function public.transfer_jihe_coin(p_from_id uuid, p_to_id uuid, p_amount numeric)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_balance numeric;
  v_transfer_id text;
begin
  if p_from_id = p_to_id then
    return json_build_object('ok', false, 'error', 'cannot transfer to self');
  end if;
  if p_amount is null or p_amount <= 0 then
    return json_build_object('ok', false, 'error', 'invalid amount');
  end if;
  select jihe_coin_balance into v_from_balance from public.user_profiles where id = p_from_id for update;
  if not found then
    return json_build_object('ok', false, 'error', 'sender not found');
  end if;
  if v_from_balance < p_amount then
    return json_build_object('ok', false, 'error', 'insufficient balance');
  end if;
  if not exists (select 1 from public.user_profiles where id = p_to_id) then
    return json_build_object('ok', false, 'error', 'recipient not found');
  end if;
  v_transfer_id := gen_random_uuid()::text;
  update public.user_profiles set jihe_coin_balance = jihe_coin_balance - p_amount, updated_at = now() where id = p_from_id;
  update public.user_profiles set jihe_coin_balance = jihe_coin_balance + p_amount, updated_at = now() where id = p_to_id;
  insert into public.jihe_coin_ledger (user_id, amount, reason, reference_type, reference_id) values
    (p_from_id, -p_amount, 'transfer_out', 'transfer', v_transfer_id),
    (p_to_id, p_amount, 'transfer_in', 'transfer', v_transfer_id);
  return json_build_object('ok', true, 'transfer_id', v_transfer_id);
end;
$$;
