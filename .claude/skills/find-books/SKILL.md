---
name: find-books
description: >-
  通过 Anna's Archive（安娜的档案馆）搜索和下载电子书/文献，并可用 DeepSeek API
  把外文书名、简介或正文翻译成中文。当用户想找书、查电子书、下载某本书、按书名/
  作者/主题检索图书或论文，或需要翻译外文书目信息时使用。触发词：找书、查书、
  搜书、下载电子书、Anna's Archive、安娜、annas-archive、电子书、文献。
---

# 找书（Anna's Archive + DeepSeek 翻译）

通过 Anna's Archive 检索并下载电子书/文献，可选用 DeepSeek 把外文信息翻成中文。
所有功能都在 `scripts/annas.py` 里，只依赖 Python 标准库，任何会话可直接运行。

## 配置方式（二选一，环境变量优先级更高）

- **方式 A（已用，最省事）**：直接写在 `scripts/config.json` 里，随仓库走，任何会话自动读取。
- **方式 B（更安全）**：在 Claude Code 网页版「环境设置」里配成环境变量/Secret。

> 无论哪种方式，都还需要在**环境的网络策略**里放行 `annas-archive.is`（及镜像）和
> `api.deepseek.com`，否则云端服务器连不出去（表现为 403）。这一步无法写进仓库，
> 只能在网页版环境设置里改。

## 配置项（环境变量名 = config.json 的键名）

| 变量 | 用途 | 是否必需 |
| --- | --- | --- |
| `ANNAS_SECRET_KEY` | Anna's Archive 账号的 **Secret key**（账号设置页里那把登录密钥）| 下载必需；搜索通常可不用 |
| `DEEPSEEK_API_KEY` | DeepSeek 的 API key | 翻译必需 |
| `ANNAS_BASE_URL` | 当前工作域名（**经常变**，见下方），默认 `annas-archive.is` | 建议设置 |
| `DEEPSEEK_BASE_URL` | 默认 `https://api.deepseek.com` | 可选 |
| `DEEPSEEK_MODEL` | 默认 `deepseek-chat` | 可选 |

> ⚠️ 不要把密钥写进代码或聊天里。快速下载需要 Anna's Archive 的**付费会员**额度。

## ⚠️ 关于 Anna's Archive 域名（重要）

Anna's Archive 域名**经常被查封、频繁更换**：`.org` 已于 2026-01 关停、`.li` 于
2026-03 删除。**当前工作域名请以官方维基百科页面为准**：
<https://en.wikipedia.org/wiki/Anna%27s_Archive>。当前在用的是
`annas-archive.is`（已设为默认并列入白名单）；其它已知官方镜像有
`annas-archive.gl` / `annas-archive.pk` / `annas-archive.gd`。

用法：域名变了就把新的设进环境变量 `ANNAS_BASE_URL`（例如 `annas-archive.is`）。

**防钓鱼/防泄露密钥的机制**（脚本已内置）：
- **搜索**不带密钥，会在已知官方镜像间自动轮换，安全。
- **下载**会把你的 Secret key 作为参数发出，因此脚本**只**发往你显式设置的
  `ANNAS_BASE_URL` 或内置的官方白名单域名；若你设置的域名不在白名单内，会先在
  stderr 打印警告——**请务必确认该域名是官方的再继续**，否则密钥可能被钓鱼站窃取。
- 域名更新后，改内置白名单在 `scripts/annas.py` 的 `KNOWN_MIRRORS`。

## 用法

脚本路径：`.claude/skills/find-books/scripts/annas.py`

```bash
# 1) 搜索
python .claude/skills/find-books/scripts/annas.py search "深度学习 花书" --limit 15

# 2) 搜索并把书名翻成中文（外文书很有用）
python .claude/skills/find-books/scripts/annas.py search "clean architecture" --translate

# 3) 只搜论文/期刊
python .claude/skills/find-books/scripts/annas.py search "transformer attention" --content journals

# 4) 按 md5 下载（需要 ANNAS_SECRET_KEY，文件存到 ./downloads）
python .claude/skills/find-books/scripts/annas.py download <md5> --out downloads

# 5) 单独翻译任意文字
python .claude/skills/find-books/scripts/annas.py translate "The Pragmatic Programmer: your journey to mastery"

# 任何命令加 --json 输出结构化结果，便于我进一步处理
```

## 典型流程（我该怎么帮用户）

1. 用户说要找某本书 → 跑 `search`，把结果整理成清单展示：**书名 · 作者/年份/格式/大小 · md5**。
2. 外文书名/简介 → 视需要用 `--translate` 或 `translate` 给出中文。
3. 用户选定某本 → 用它的 **md5** 跑 `download`（前提是配了 `ANNAS_SECRET_KEY`）。
4. 若搜索报「被验证码拦截 / 未解析到结果」→ 提示换 `ANNAS_BASE_URL` 镜像，或稍后再试。

## 接口说明（脚本内部）

- 搜索：`GET https://<base>/search?q=<关键词>&content=book_any`，解析 HTML 里
  `/md5/<32位哈希>` 的链接（会先去掉包裹结果卡片的 HTML 注释标记）。
- 下载：`GET https://<base>/dyn/api/fast_download.json?md5=<md5>&key=<secret>`，
  取返回的 `download_url` 再下载文件。
- 翻译：`POST https://api.deepseek.com/chat/completions`（OpenAI 兼容），
  `Authorization: Bearer <DEEPSEEK_API_KEY>`，模型 `deepseek-chat`。

`content` 可选值：`book_any`（默认）、`book_fiction`、`book_nonfiction`、
`book_unknown`、`journals`、`magazine`、`standards_document`、`book_comic`。
