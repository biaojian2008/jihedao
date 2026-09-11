#!/usr/bin/env python3
"""
Anna's Archive 找书工具 —— 搜索 / 下载 / DeepSeek 翻译。

只用 Python 标准库（urllib），无需 pip 安装，任何会话都能直接跑。

环境变量：
  ANNAS_SECRET_KEY   Anna's Archive 账号的 Secret key（下载必需，搜索可选）
  ANNAS_BASE_URL     镜像域名，默认 annas-archive.org（可换 annas-archive.se / .gl）
  DEEPSEEK_API_KEY   DeepSeek API key（翻译必需）
  DEEPSEEK_BASE_URL  默认 https://api.deepseek.com

用法：
  python annas.py search "关键词" [--content book_any|journals|...] [--limit 20] [--json]
  python annas.py download <md5> [--out 目录] [--json]
  python annas.py translate "要翻译的文字" [--to 中文] [--json]
  python annas.py search "关键词" --translate      # 搜索并把书名/信息翻成中文
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

DEFAULT_BASE = "annas-archive.org"
MIRRORS = ["annas-archive.org", "annas-archive.se", "annas-archive.gl"]
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36")


def _base():
    return os.environ.get("ANNAS_BASE_URL", DEFAULT_BASE).strip().rstrip("/")


def _key():
    return os.environ.get("ANNAS_SECRET_KEY", "").strip()


def _bases_to_try():
    """当前配置的域名优先，再尝试其它镜像。"""
    b = _base()
    order = [b] + [m for m in MIRRORS if m != b]
    seen, out = set(), []
    for x in order:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def _fetch(url, timeout=30):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/json,*/*",
        "Accept-Language": "en,zh-CN;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
        ct = resp.headers.get("Content-Type", "")
        cd = resp.headers.get("Content-Disposition", "")
        return raw, ct, cd


def _clean_text(html_frag):
    # 去标签、还原实体、压缩空白
    txt = re.sub(r"<[^>]+>", " ", html_frag)
    txt = (txt.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
              .replace("&quot;", '"').replace("&#39;", "'").replace("&nbsp;", " "))
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt


# ---------------------------------------------------------------- 搜索
def search(query, content="book_any", limit=25):
    """返回结果列表：[{md5, title, info}]。Anna's Archive 会把部分结果卡片
    藏在 HTML 注释里由前端展开，这里先去掉注释标记再解析。"""
    last_err = None
    q = urllib.parse.quote(query)
    for base in _bases_to_try():
        url = f"https://{base}/search?q={q}&content={content}"
        try:
            raw, ct, _ = _fetch(url)
        except Exception as e:  # noqa: BLE001
            last_err = e
            continue
        text = raw.decode("utf-8", "replace")
        # 展开被注释包裹的结果卡片
        text = text.replace("<!--", "").replace("-->", "")
        results, seen = [], set()
        for m in re.finditer(r'<a\s+href="/md5/([0-9a-fA-F]{32})"[^>]*>(.*?)</a>',
                             text, re.DOTALL | re.IGNORECASE):
            md5 = m.group(1).lower()
            if md5 in seen:
                continue
            seen.add(md5)
            info = _clean_text(m.group(2))
            # 卡片内第一段通常是元数据（语言/格式/大小），之后是标题
            title = info
            parts = re.split(r"\s{2,}", info)
            if len(parts) >= 2:
                title = parts[1] if len(parts[1]) > len(parts[0]) else parts[0]
            results.append({"md5": md5, "title": title[:300], "info": info[:500]})
            if len(results) >= limit:
                break
        if results:
            return {"base": base, "query": query, "count": len(results),
                    "results": results}
        # 页面拿到了但没解析出结果 —— 记下再试下一个镜像
        last_err = RuntimeError(f"{base}: 页面已加载但未解析到结果（可能被验证码拦截或版式变化）")
    raise SystemExit(f"[搜索失败] {last_err}")


# ---------------------------------------------------------------- 下载
def download(md5, out_dir="."):
    key = _key()
    if not key:
        raise SystemExit("[下载失败] 未设置 ANNAS_SECRET_KEY，无法调用快速下载 API。")
    md5 = md5.lower().strip()
    last_err = None
    for base in _bases_to_try():
        api = f"https://{base}/dyn/api/fast_download.json?md5={md5}&key={urllib.parse.quote(key)}"
        try:
            raw, _, _ = _fetch(api)
            data = json.loads(raw.decode("utf-8", "replace"))
        except Exception as e:  # noqa: BLE001
            last_err = e
            continue
        if data.get("error"):
            raise SystemExit(f"[下载失败] Anna's Archive 返回错误：{data['error']}")
        dl = data.get("download_url")
        if not dl:
            last_err = RuntimeError(f"{base}: 返回中没有 download_url：{data}")
            continue
        # 取回文件
        try:
            fraw, _, cd = _fetch(dl, timeout=120)
        except Exception as e:  # noqa: BLE001
            raise SystemExit(f"[下载失败] 取回文件出错：{e}")
        fname = _filename_from_cd(cd) or f"{md5}.bin"
        os.makedirs(out_dir, exist_ok=True)
        path = os.path.join(out_dir, fname)
        with open(path, "wb") as f:
            f.write(fraw)
        return {"md5": md5, "path": path, "bytes": len(fraw),
                "download_url": dl,
                "account": data.get("account_fast_download_info", {})}
    raise SystemExit(f"[下载失败] {last_err}")


def _filename_from_cd(cd):
    if not cd:
        return None
    m = re.search(r"filename\*?=(?:UTF-8'')?\"?([^\";]+)", cd)
    if m:
        return urllib.parse.unquote(m.group(1)).strip().strip('"')
    return None


# ---------------------------------------------------------------- 翻译
def translate(text, to="中文"):
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not key:
        raise SystemExit("[翻译失败] 未设置 DEEPSEEK_API_KEY。")
    base = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
    body = json.dumps({
        "model": os.environ.get("DEEPSEEK_MODEL", "deepseek-chat"),
        "messages": [
            {"role": "system",
             "content": f"你是专业翻译。把用户给出的内容准确翻译成{to}，"
                        "只输出译文，不要解释、不要加引号。书名、作者名等专有名词"
                        "保留常见通行译法，无通行译法时可括注原文。"},
            {"role": "user", "content": text},
        ],
        "temperature": 1.3,
        "stream": False,
    }).encode("utf-8")
    req = urllib.request.Request(f"{base}/chat/completions", data=body, method="POST",
                                 headers={"Authorization": f"Bearer {key}",
                                          "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as e:  # noqa: BLE001
        raise SystemExit(f"[翻译失败] HTTP {e.code}: {e.read().decode('utf-8','replace')[:300]}")
    except Exception as e:  # noqa: BLE001
        raise SystemExit(f"[翻译失败] {e}")
    return data["choices"][0]["message"]["content"].strip()


# ---------------------------------------------------------------- CLI
def main():
    p = argparse.ArgumentParser(description="Anna's Archive 找书工具")
    sub = p.add_subparsers(dest="cmd", required=True)

    ps = sub.add_parser("search", help="搜索图书")
    ps.add_argument("query")
    ps.add_argument("--content", default="book_any",
                    help="book_any / book_fiction / book_nonfiction / journals / ...")
    ps.add_argument("--limit", type=int, default=25)
    ps.add_argument("--translate", action="store_true", help="把书名/信息翻成中文")
    ps.add_argument("--json", action="store_true")

    pd = sub.add_parser("download", help="按 md5 下载（需 ANNAS_SECRET_KEY）")
    pd.add_argument("md5")
    pd.add_argument("--out", default=".")
    pd.add_argument("--json", action="store_true")

    pt = sub.add_parser("translate", help="用 DeepSeek 翻译文字")
    pt.add_argument("text")
    pt.add_argument("--to", default="中文")
    pt.add_argument("--json", action="store_true")

    a = p.parse_args()

    if a.cmd == "search":
        res = search(a.query, content=a.content, limit=a.limit)
        if a.translate:
            joined = "\n".join(f"{i+1}. {r['title']}"
                               for i, r in enumerate(res["results"]))
            res["translated"] = translate(joined)
        if a.json:
            print(json.dumps(res, ensure_ascii=False, indent=2))
        else:
            print(f"命中 {res['count']} 条（来源 {res['base']}）：\n")
            for i, r in enumerate(res["results"], 1):
                print(f"{i}. {r['title']}")
                print(f"   {r['info']}")
                print(f"   md5: {r['md5']}\n")
            if a.translate:
                print("—— 中文（DeepSeek）——")
                print(res["translated"])

    elif a.cmd == "download":
        res = download(a.md5, out_dir=a.out)
        if a.json:
            print(json.dumps(res, ensure_ascii=False, indent=2))
        else:
            print(f"已下载：{res['path']}（{res['bytes']} 字节）")
            acc = res.get("account") or {}
            if acc:
                print(f"账户信息：{json.dumps(acc, ensure_ascii=False)}")

    elif a.cmd == "translate":
        out = translate(a.text, to=a.to)
        if a.json:
            print(json.dumps({"translated": out}, ensure_ascii=False, indent=2))
        else:
            print(out)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
