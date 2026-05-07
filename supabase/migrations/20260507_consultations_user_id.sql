-- 济和参谋：咨询记录关联登录用户（用于济和币扣费与追问鉴权）
alter table consultations add column if not exists user_id uuid references user_profiles (id);

create index if not exists consultations_user_id_created_idx
  on consultations (user_id, created_at desc);

comment on column consultations.user_id is '登录用户 profile id；追问时须与 cookie 一致';
