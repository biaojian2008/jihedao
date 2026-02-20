-- 评论点赞、收藏、回复
-- 1. 评论表增加 parent_id（回复）
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
create index if not exists idx_comments_parent on public.comments(parent_id);

-- 2. 评论点赞
create table if not exists public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);
create index if not exists idx_comment_likes_comment on public.comment_likes(comment_id);
create index if not exists idx_comment_likes_user on public.comment_likes(user_id);

-- 3. 评论收藏
create table if not exists public.saved_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  comment_id uuid not null references public.comments(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, comment_id)
);
create index if not exists idx_saved_comments_user on public.saved_comments(user_id);
