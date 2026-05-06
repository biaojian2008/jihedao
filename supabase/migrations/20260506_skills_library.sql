-- 超级个体技能库：分类与技能条目（公开只读；更新经 Service Role / 管理 API）

create table if not exists public.skill_categories (
  id uuid default gen_random_uuid() primary key,
  order_num integer not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create unique index if not exists skill_categories_name_key on public.skill_categories (name);

create table if not exists public.skills (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references public.skill_categories(id) on delete set null,
  name text not null,
  summary text,
  content text,
  difficulty text,
  resources text,
  order_num integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists skills_category_id_idx on public.skills (category_id);
create index if not exists skills_category_order_idx on public.skills (category_id, order_num);
create index if not exists skill_categories_order_idx on public.skill_categories (order_num);

alter table public.skill_categories enable row level security;
alter table public.skills enable row level security;

drop policy if exists "skill_categories_select_public" on public.skill_categories;
create policy "skill_categories_select_public"
  on public.skill_categories for select
  using (true);

drop policy if exists "skills_select_public" on public.skills;
create policy "skills_select_public"
  on public.skills for select
  using (true);

insert into public.skill_categories (order_num, name) values
(1, '身体与医疗'),
(2, '工程与修理'),
(3, '能源'),
(4, '野外生存'),
(5, '农业与自动化'),
(6, '通信与网络'),
(7, '方位与导航'),
(8, '自卫与避险'),
(9, '资产与财务主权'),
(10, 'AI与数字工具'),
(11, '硬件与制造'),
(12, '社群与组织')
on conflict (name) do nothing;

-- 技能种子（按分类名 + 技能名幂等）
insert into public.skills (category_id, name, order_num)
select c.id, v.skill_name, v.ord from public.skill_categories c
cross join (values
  ('身体与医疗', '常用急救', 1),
  ('身体与医疗', '骨折固定与处理', 2),
  ('身体与医疗', '牙科应急处理', 3),
  ('身体与医疗', '分娩基础知识', 4),
  ('身体与医疗', '简单手术', 5),
  ('身体与医疗', '药物认识', 6),
  ('身体与医疗', '草药识别', 7),
  ('身体与医疗', '野外制药', 8),
  ('工程与修理', '竹木工程', 1),
  ('工程与修理', '木工工具', 2),
  ('工程与修理', '焊接与切割', 3),
  ('工程与修理', '混凝土与砌砖', 4),
  ('工程与修理', '水管与排污', 5),
  ('工程与修理', '车辆基础维修', 6),
  ('工程与修理', '锁具与安防', 7),
  ('工程与修理', '绳结与索具', 8),
  ('能源', '基础电学', 1),
  ('能源', '手动发电', 2),
  ('能源', '太阳能系统', 3),
  ('能源', '水力发电', 4),
  ('能源', '沼气制作', 5),
  ('能源', '蓄电池维护', 6),
  ('能源', '燃料储存与管理', 7),
  ('野外生存', '生火', 1),
  ('野外生存', '取水与净水', 2),
  ('野外生存', '庇护所搭建', 3),
  ('野外生存', '气象判断', 4),
  ('野外生存', '可食植物识别', 5),
  ('野外生存', '动物追踪与痕迹识别', 6),
  ('野外生存', '陷阱制作', 7),
  ('野外生存', '自制狩猎工具', 8),
  ('野外生存', '绳索制作', 9),
  ('野外生存', '食物储存与保鲜', 10),
  ('野外生存', '无具烹饪', 11),
  ('农业与自动化', '种子保存', 1),
  ('农业与自动化', '土壤检测与改良', 2),
  ('农业与自动化', '水培与气培', 3),
  ('农业与自动化', '害虫综合防治', 4),
  ('农业与自动化', '禽畜基础医疗', 5),
  ('农业与自动化', '发酵工程', 6),
  ('农业与自动化', '生物化学基础', 7),
  ('农业与自动化', '低功耗自动化', 8),
  ('农业与自动化', '雨水收集系统', 9),
  ('通信与网络', '摩斯密码', 1),
  ('通信与网络', '业余无线电', 2),
  ('通信与网络', '自制收发器', 3),
  ('通信与网络', 'SDR技术', 4),
  ('通信与网络', 'LoRa与网状网络', 5),
  ('通信与网络', '卫星通信基础', 6),
  ('通信与网络', '科学上网', 7),
  ('通信与网络', '暗网与匿名通信', 8),
  ('通信与网络', '信息加密', 9),
  ('方位与导航', '地图基础', 1),
  ('方位与导航', 'GPS使用', 2),
  ('方位与导航', '离线地图与导航', 3),
  ('方位与导航', '死算导航', 4),
  ('方位与导航', '自制指北针', 5),
  ('方位与导航', '天文导航与六分仪', 6),
  ('自卫与避险', '情境感知训练', 1),
  ('自卫与避险', '反跟踪与隐蔽', 2),
  ('自卫与避险', '撤离路线规划', 3),
  ('自卫与避险', '辣椒水制作', 4),
  ('自卫与避险', '电击棍制作', 5),
  ('自卫与避险', '枪械使用', 6),
  ('自卫与避险', '基础格斗', 7),
  ('资产与财务主权', '认识区块链', 1),
  ('资产与财务主权', '数字货币', 2),
  ('资产与财务主权', '加密技术', 3),
  ('资产与财务主权', '冷钱包技术', 4),
  ('资产与财务主权', '贵金属实物储存', 5),
  ('资产与财务主权', '离岸账户基础', 6),
  ('资产与财务主权', '第二身份与多护照法律路径', 7),
  ('资产与财务主权', '遗产规划与信托结构', 8),
  ('AI与数字工具', '调用API', 1),
  ('AI与数字工具', 'Prompt工程', 2),
  ('AI与数字工具', '自动化流程', 3),
  ('AI与数字工具', '数据抓取与处理', 4),
  ('AI与数字工具', '向量知识库', 5),
  ('AI与数字工具', '本地模型部署与微调', 6),
  ('AI与数字工具', 'AI Agent构建', 7),
  ('硬件与制造', 'Arduino使用', 1),
  ('硬件与制造', '树莓派使用', 2),
  ('硬件与制造', '基础电路焊接', 3),
  ('硬件与制造', '3D打印基础', 4),
  ('硬件与制造', '桌面CNC', 5),
  ('硬件与制造', '传感器与控制器', 6),
  ('社群与组织', 'DAO治理基础', 1),
  ('社群与组织', '小组决策机制', 2),
  ('社群与组织', '物资共享与记账', 3),
  ('社群与组织', '技能交换体系', 4),
  ('社群与组织', '冲突调解基础', 5),
  ('社群与组织', '基础法律知识', 6)
) as v(cat_name, skill_name, ord)
where c.name = v.cat_name
  and not exists (
    select 1 from public.skills s where s.category_id = c.id and s.name = v.skill_name
  );
