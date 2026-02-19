# Readwise 个人情报接入配置

## 两种模式

1. **默认（网站级）**：管理员配置一次 Token，所有用户看到同一份阅读标注，无需个人配置。
2. **个人化**：用户在个人中心绑定自己的 Readwise Token，看到自己的标注（优先于网站默认）。

## 你需要做的事

### 1. 配置网站默认 Token（供“懒惰用户”使用）

在项目根目录的 `.env.local`（本地）或 Vercel 的 Environment Variables 中添加：

```
READWISE_API_TOKEN=你的Readwise_API_Token
```

- 获取 Token：登录 [readwise.io](https://readwise.io) → [Settings → API Access](https://readwise.io/access_token)
- 配置后，未绑定个人 Token 的用户会看到这份默认标注。

### 2. 数据库迁移（若未执行）

在 Supabase SQL Editor 中执行 `supabase/migrations/20250219_readwise_token.sql`，为 `user_profiles` 表增加 `readwise_token` 列。

### 3. 用户端操作

- **默认用户**：无需操作，进入个人中心即可看到网站默认情报。
- **个人化用户**：个人中心 → 个人情报接入 · Readwise → 输入个人 Token → 点击「绑定个人」。如需恢复默认，点击「清除个人」。
