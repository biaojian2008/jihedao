# 部署到 GitHub + 真实域名访问

## 一、上传到 GitHub

### 1. 安装 Git（若未安装）

从 https://git-scm.com/download/win 下载安装。

### 2. 在项目目录里初始化并推送

在项目根目录 `e:\jihedao.xyz` 打开 **PowerShell** 或 **CMD**，依次执行：

```bash
git init
git add .
git commit -m "Initial commit: 济和 DAO"
```

### 3. 在 GitHub 建仓库

1. 打开 https://github.com/new
2. Repository name 填：`jihedao`（或任意英文名）
3. 选 **Public**，不要勾选 “Add a README”
4. 点 **Create repository**

### 4. 关联并推送

把下面命令里的 `你的用户名` 换成你的 GitHub 用户名，`jihedao` 换成你刚建的仓库名：

```bash
git remote add origin https://github.com/你的用户名/jihedao.git
git branch -M main
git push -u origin main
```

若提示登录，按提示用浏览器或 Personal Access Token 完成认证。

---

## 二、用真实域名访问（Vercel + 自定义域名）

### 1. 部署到 Vercel

1. 打开 https://vercel.com 并登录（可用 GitHub 账号）
2. 点 **Add New…** → **Project**
3. **Import** 你刚推送的 GitHub 仓库（如 `jihedao`）
4. 保持默认设置，点 **Deploy**
5. 等一两分钟，会得到一个地址：`https://jihedao-xxx.vercel.app`

此时已经可以用 Vercel 给的域名访问。

### 2. 配置环境变量（重要）

在 Vercel 项目里：

1. 进入项目 → **Settings** → **Environment Variables**
2. 把本地 `.env.local` 里用到的变量逐个添加（如 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY` 等）
3. 每个变量选 **Production / Preview**，保存后重新 **Redeploy** 一次

### 3. 绑定自己的域名

1. 在 Vercel 项目里点 **Settings** → **Domains**
2. 在输入框填你的域名（如 `jihedao.xyz` 或 `www.jihedao.xyz`），点 **Add**
3. 按页面提示去**域名服务商**（阿里云、腾讯云、Cloudflare、GoDaddy 等）做解析：
   - 若 Vercel 要求 **CNAME**：把 `www`（或提示的子域名）指向 `cname.vercel-dns.com`
   - 若要求 **A 记录**：把 `@` 指向 Vercel 给的 IP（页面上会写）
4. 解析生效后（几分钟到几小时），用浏览器访问你的域名即可

---

## 注意

- **不要**把 `.env.local` 提交到 GitHub（项目已用 `.gitignore` 忽略 `.env*`）
- 密钥只在 Vercel 的 Environment Variables 里配置，不要写进代码
