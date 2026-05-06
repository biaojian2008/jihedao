-- 参谋历史：按浏览器端匿名 token 区分会话，仅通过自建 API 查询
alter table consultations add column if not exists client_token text;

create index if not exists consultations_client_token_created_idx
  on consultations (client_token, created_at desc);

comment on column consultations.client_token is '浏览器 localStorage 中的匿名 UUID，用于历史列表隔离';
