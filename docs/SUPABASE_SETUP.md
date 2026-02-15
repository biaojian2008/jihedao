# Supabase 配置指南（济和 DAO）

按顺序执行以下步骤，解决「Could not find the table public.user_profiles」和「new row violates row-level security policy」等错误。

---

## 一、创建数据库表

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)，选择你的项目 `xkvcudutzvkltfcpbptq`
2. 左侧菜单点击 **SQL Editor**
3. 点击 **New query**
4. 复制 `supabase/schema.sql` 的**全部内容**，粘贴到编辑器中
5. 点击 **Run** 执行

执行成功后，将创建 `user_profiles`、`jihe_coin_ledger`、`posts`、`cms_config` 等表，以及 `transfer_jihe_coin` 函数。

---

## 二、创建 Storage 公开 Bucket `cms`

1. 在 Supabase Dashboard 左侧点击 **Storage**
2. 点击 **New bucket**
3. Name 填：`cms`
4. 勾选 **Public bucket**（允许匿名读取）
5. 点击 **Create bucket**
6. 如需上传图片，点击 `cms` bucket → **Policies** → **New policy**，添加允许插入的策略（按需选择 authenticated / anon）。

---

## 三、发布页扩展（抵押、冻结、参加/退出）

执行 `supabase/migrations/20250213_post_collateral_participants.sql`，为 `posts` 表增加抵押、冻结、时长、收益、归还、智能合约等字段，以及 `post_participants` 表。

## 三之二、信誉与 SBT 系统

执行 `supabase/migrations/20250213_reputation_sbt.sql`，创建 `sbt_records`、`reputation_config` 表。

## 四、确认转账函数已存在

若第一步已执行完整 `schema.sql`，则 `transfer_jihe_coin` 已创建。  
若只执行了部分 SQL，可单独执行 `supabase/migrations/transfer_jihe_coin.sql`：

1. SQL Editor → New query
2. 粘贴 `supabase/migrations/transfer_jihe_coin.sql` 内容
3. Run

---

## 五、重启 / 刷新应用

- 若在本地开发：保存代码后刷新页面即可
- 无需重启 Next.js 开发服务器

---

## 常见错误对照

| 错误 | 原因 | 处理 |
|------|------|------|
| Could not find table `public.user_profiles` | 未执行 schema.sql | 执行步骤一 |
| new row violates row-level security policy | cms bucket 不存在或策略不对 | 执行步骤二 |
| 转账失败 / insufficient balance | 未执行 transfer_jihe_coin | 执行步骤四 |
| 发布项目/任务报错缺少字段 | 未执行 post_collateral_participants 迁移 | 执行步骤三 |
