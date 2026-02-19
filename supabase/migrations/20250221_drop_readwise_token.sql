-- 移除 Readwise：删除 user_profiles 中的 readwise_token 列
alter table if exists public.user_profiles drop column if exists readwise_token;
