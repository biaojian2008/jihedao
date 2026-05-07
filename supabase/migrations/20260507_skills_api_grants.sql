-- 确保 PostgREST（anon / authenticated）能读技能表；手动建表时若漏掉权限会导致 API 返回空数组且无报错
grant usage on schema public to anon, authenticated;
grant select on public.skill_categories to anon, authenticated;
grant select on public.skills to anon, authenticated;
