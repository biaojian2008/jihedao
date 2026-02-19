-- 个人情报接入：Readwise API Token（Demo 用明文存储，生产环境可改为加密）
alter table public.user_profiles add column if not exists readwise_token text;

comment on column public.user_profiles.readwise_token is 'Readwise API Token for personal highlights sync (demo: plain text)';
