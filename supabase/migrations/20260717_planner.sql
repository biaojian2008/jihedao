-- 家庭全球发展路径规划器（免费测算 → 报告 → 预约诊断）
-- 在 Supabase SQL Editor 执行本文件

-- 1. 测算报告（用户提交的信息留存 = 需求调研资产）
create table if not exists planner_reports (
  id uuid default gen_random_uuid() primary key,
  client_token text,                 -- 浏览器匿名标识（未登录也可测算）
  user_id text,                      -- 已登录用户
  answers jsonb not null,            -- 家长录入的原始答案
  report jsonb not null,             -- 引擎生成的结构化报告（含 AI 叙事）
  created_at timestamp default now()
);

create index if not exists planner_reports_client_token_idx on planner_reports (client_token);
create index if not exists planner_reports_user_id_idx on planner_reports (user_id);
create index if not exists planner_reports_created_at_idx on planner_reports (created_at desc);

-- 2. 人工诊断预约（付费转化入口）
create table if not exists planner_bookings (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references planner_reports (id) on delete set null,
  contact text not null,             -- 微信号 / 手机号
  note text,                         -- 用户补充说明
  client_token text,
  user_id text,
  status text not null default 'pending', -- 'pending' | 'contacted' | 'done'
  created_at timestamp default now()
);

create index if not exists planner_bookings_status_idx on planner_bookings (status);
create index if not exists planner_bookings_created_at_idx on planner_bookings (created_at desc);
