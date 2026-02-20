-- 扩展 posts.type 支持 service、demand
alter table public.posts drop constraint if exists posts_type_check;
alter table public.posts add constraint posts_type_check check (type in ('project','task','product','course','service','demand','stance'));
