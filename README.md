# 济和 DAO (jihedao.xyz)

协作 · 信用 · 社交 · 数据主权的去中心化实验场。Next.js (App Router) + TypeScript + Tailwind，部署于 Vercel，数据与存储使用 Supabase，登录与钱包使用 Privy。

## 技术栈

- **框架**: Next.js 16 (App Router) + TypeScript
- **UI**: Tailwind CSS v4，深色主题 (#0a0a0a)，荧光绿 (#00ff00)，等宽字体
- **数据**: Supabase (Postgres + Storage)
- **认证与钱包**: Privy（邮箱、钱包、Farcaster）+ NextAuth 微信登录（网站应用扫码）。Privy SMS 在部分地区不可用故未启用。
- **状态与请求**: TanStack React Query
- **国际化**: 计划中/英/日（next-intl 暂未支持 Next 16，当前为占位）
- **包管理**: npm（推荐 Node 20+，与 Vercel 一致）

## 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 Supabase 与 Privy 的配置

# 启动开发服务器
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

### 手机预览

- **方式一（同一 WiFi）**：`npm run dev` 已使用 `--hostname 0.0.0.0`，本机在局域网可访问。在电脑上查看本机 IP（Windows：`ipconfig` 看「IPv4 地址」；Mac：系统设置 → 网络），手机连同一 WiFi 后，在浏览器打开 `http://<本机IP>:3000`，例如 `http://192.168.1.100:3000`。
- **方式二（外网隧道）**：
  - **ngrok**（需免费注册）：若报错 `ERR_NGROK_4018`，表示未配置 authtoken。① 打开 [ngrok 注册](https://dashboard.ngrok.com/signup) 并登录；② 打开 [Your authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) 复制 token；③ 在项目目录执行一次 `npx ngrok config add-authtoken 粘贴你的token`；④ 再运行 `npm run tunnel:ngrok`，用手机打开终端里打印的 `https://xxx.ngrok-free.app`。
  - **Cloudflare（无需注册）**：安装 [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) 后，在项目目录执行 `npm run tunnel:cf`（或直接 `cloudflared tunnel --url http://localhost:3000`），用手机打开终端里打印的 `https://xxx.trycloudflare.com`。
- **方式三（localtunnel）**：`npm run tunnel` 得到 `https://xxx.loca.lt`。若要求密码，打开 https://loca.lt/mytunnelpassword 把显示的 IP 填进去。若出现 503，改用 ngrok 或 Cloudflare。

## 环境变量（Vercel / .env.local）

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥（Settings → API → service_role），**管理后台保存 CMS 必须**，否则会报 RLS 错误 |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy 应用 ID（可选，未配置时登录为占位） |
| **`NEXTAUTH_URL`** | **部署到线上必填**，与站点一致，如 `https://www.jihedao.xyz` 或 `https://jihedao.xyz`。未设会导致 "Server error" |
| **`NEXTAUTH_SECRET`** | **部署到线上必填**，任意随机字符串（如 `openssl rand -base64 32` 生成）。未设会导致 "Server error" |
| `AUTH_GOOGLE_CLIENT_ID` / `AUTH_GOOGLE_CLIENT_SECRET` | Google 登录（NextAuth），在 [Google Cloud Console](https://console.cloud.google.com) 创建 OAuth 2.0 客户端，授权回调填 `{NEXTAUTH_URL}/api/auth/callback/google` |
| `AUTH_WECHAT_APP_ID` / `AUTH_WECHAT_APP_SECRET` | 微信登录（NextAuth） |
| `ADMIN_SECRET` | 后台 API 鉴权（请求头 x-admin-secret），用于 PATCH /api/cms、POST/PATCH/DELETE /api/logs |
| `NEXT_PUBLIC_DEFAULT_AUTHOR_ID` | 可选，演示发帖用的 user_profiles.id（如种子用户 UUID） |

## 数据库初始化

在 [Supabase Dashboard](https://supabase.com/dashboard) 中创建项目后，在 SQL Editor 中执行：

```
supabase/schema.sql
```

该脚本会创建 `cms_config`、`official_logs`、`user_profiles`（含 `wechat_openid`、`jihe_coin_balance`）、`user_badges`、`posts`、`comments`、`likes`、`jihe_coin_ledger`、`conversations`、`conversation_participants`、`messages` 等表。若表已存在，可单独执行：`alter table public.user_profiles add column if not exists wechat_openid text unique;`、`alter table public.user_profiles add column if not exists jihe_coin_balance numeric not null default 0 check (jihe_coin_balance >= 0);`

## 济和币（模拟钱包）

每个账户在 `user_profiles.jihe_coin_balance` 有模拟济和币余额，流水记在 `jihe_coin_ledger`。发帖成功会自动发放（需配置 `SUPABASE_SERVICE_ROLE_KEY`）。规则与发放逻辑在 `src/lib/jihe-coin.ts`，可扩展评论、点赞、任务完成等触发。个人页 `/u/[id]` 展示当前余额。

## 管理后台上传图片（Storage）

后台 `/admin` 中 Hero 大图、济和营地图片、落地实体营地图片支持「本地上传」，文件会存到 Supabase Storage。若上传时报 **Bucket not found**，需在 Supabase 控制台先建桶：

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 选择项目 → **Storage**。
2. 点击 **New bucket**，名称填 **`cms`**（必须一致）。
3. 勾选 **Public bucket**（公开），这样上传后返回的 URL 可直接在首页展示。
4. 创建完成后，回到管理页重试上传。

## 首页动态文案（CMS）

首页的 Hero 大图、标题、副标题、段落、按钮文案和「核心特性」区块均来自 Supabase 表 `cms_config`。在后台 `/admin` 中编辑对应 key 的 value 后，前台会自动展示，**无需重新发版**。

Key 示例：`hero_image_url`、`hero_title`、`hero_title_highlight`、`hero_subtitle`、`hero_description`、`hero_cta_primary`、`hero_cta_secondary`、`highlights`（JSON 数组）。

## Privy 配置

1. 在 [Privy Dashboard](https://dashboard.privy.io) 创建应用，获取 App ID。
2. 在应用设置中启用登录方式：Email、Wallet、Farcaster（按需）。SMS 在部分区域会报 "This region is not supported"，当前未启用。
3. 将 App ID 填入 `NEXT_PUBLIC_PRIVY_APP_ID`。
4. 部署后在 Privy 中配置允许的域名（如 `jihedao.xyz`、`*.vercel.app`）。

## 部署到 Vercel

1. 将仓库推送到 GitHub。
2. 在 [Vercel](https://vercel.com) 导入项目，选择该仓库。
3. 在项目 Settings → Environment Variables 中配置上述环境变量。
4. 部署后如需自定义域名，在 Vercel 项目设置中添加域名。

构建命令与输出目录使用 Vercel 默认（`npm run build`、`.next`）即可。

## 项目结构概要

- `src/app/`：页面与 API 路由（首页、/log、/log/[id]、/community、/u/[id]、/admin、/api/cms、/api/logs）
- `src/components/`：布局（Nav、BottomNav）、Providers（React Query、Privy）
- `src/lib/`：Supabase、Auth 上下文、React Query、`i18n/`（locale context + 中/英/日 messages）、`encryption.ts`（消息加密占位）、`onchain.ts`（Base 链存证预留）
- `supabase/schema.sql`：表结构

## 国际化（中/英/日）

语言通过 cookie `jihe_locale`（值 `zh`|`en`|`ja`）持久化，导航栏提供「中 | en | 日」切换。切换语言时会执行 `router.refresh()`，**全文内容**（首页 CMS、日志、帖子）会按当前语言重新拉取并渲染。

- **界面文案**：在 `src/lib/i18n/messages.ts` 中维护，通过 `useLocale().t(key)` 取当前语言。
- **动态内容多语言**：首页 `cms_config`、日志 `official_logs`、帖子 `posts` 的 title/content 等字段支持两种存法：
  - 纯字符串：所有语言显示同一段文案；
  - 对象 `{ "zh": "中文", "en": "English", "ja": "日本語" }`（或 JSON 字符串）：按当前语言显示。后台或 Supabase 中按此格式编辑即可实现全文切换。

## 路线图（MVP 阶段）

- [x] 项目骨架、深色主题、导航、首页 CMS、日志、社区、个人名片、Admin
- [x] 社区 Feed、万能发布件、Privy 登录同步 user_profiles、发帖用当前用户
- [x] 个人名片 /u/[id]、SBT 勋章墙；私信 /dm、/dm/[id]、会话与消息 API
- [x] 后台 CMS、日志 CRUD、ADMIN_SECRET 校验
- [x] 中/英/日国际化（cookie `jihe_locale` + LocaleProvider + 导航切换）；消息加密占位 `src/lib/encryption.ts`；Base 链存证预留 `src/lib/onchain.ts` 与 posts API 注释
