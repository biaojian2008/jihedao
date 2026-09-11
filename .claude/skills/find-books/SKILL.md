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

## 前置：环境变量（在 Claude Code 网页版环境设置里配置为 Secret）

| 变量 | 用途 | 是否必需 |
| --- | --- | --- |
| `ANNAS_SECRET_KEY` | Anna's Archive 账号的 **Secret key**（账号设置页里那把登录密钥）| 下载必需；搜索通常可不用 |
| `DEEPSEEK_API_KEY` | DeepSeek 的 API key | 翻译必需 |
| `ANNAS_BASE_URL` | 镜像域名，默认 `annas-archive.org`，可改 `annas-archive.se` / `annas-archive.gl` | 可选 |
| `DEEPSEEK_BASE_URL` | 默认 `https://api.deepseek.com` | 可选 |
| `DEEPSEEK_MODEL` | 默认 `deepseek-chat` | 可选 |

> ⚠️ 不要把密钥写进代码或聊天里。快速下载需要 Anna's Archive 的**付费会员**额度。

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
