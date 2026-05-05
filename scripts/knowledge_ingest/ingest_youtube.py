#!/usr/bin/env python3
"""
YouTube 链接 → yt-dlp 下载音频 → OpenAI Whisper 转写 → embedding → knowledge_base。

用法:
  python ingest_youtube.py --url "https://www.youtube.com/watch?v=xxxx" --domain education

依赖: pip install -r requirements.txt
系统依赖: 本机已安装 yt-dlp（在 PATH 中），例如: pip install yt-dlp 或按官网安装。
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from ingest_common import chunk_text, embed_chunks, get_env, get_supabase, load_dotenv_safe, openai_client


def run_yt_dlp(url: str, out_dir: Path) -> Path:
    """下载音频为 mp3，返回文件路径。"""
    out_dir.mkdir(parents=True, exist_ok=True)
    pattern = str(out_dir / "%(title)s.%(ext)s")
    cmd = [
        "yt-dlp",
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "5",
        "-o",
        pattern,
        "--no-playlist",
        url,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"yt-dlp 失败:\n{r.stderr or r.stdout}")

    mp3s = list(out_dir.glob("*.mp3"))
    if not mp3s:
        raise RuntimeError("yt-dlp 未生成 mp3 文件")
    return max(mp3s, key=lambda p: p.stat().st_mtime)


def transcribe_whisper(client, audio_path: Path) -> str:
    with open(audio_path, "rb") as f:
        tr = client.audio.transcriptions.create(model="whisper-1", file=f)
    text = getattr(tr, "text", None) or str(tr)
    return text.strip()


def main() -> int:
    load_dotenv_safe()
    parser = argparse.ArgumentParser(description="YouTube 转写入库 knowledge_base")
    parser.add_argument("--url", required=True, help="YouTube 视频链接")
    parser.add_argument("--domain", required=True, help="knowledge_base.domain")
    parser.add_argument(
        "--max-chars",
        type=int,
        default=6000,
        help="单条 content 最大字符数",
    )
    args = parser.parse_args()

    if not shutil.which("yt-dlp"):
        print("错误: 未找到 yt-dlp，请先安装并加入 PATH。", file=sys.stderr)
        print("  pip install yt-dlp", file=sys.stderr)
        return 1

    get_env()
    oai = openai_client()
    supabase = get_supabase()

    with tempfile.TemporaryDirectory(prefix="yt_kb_") as tmp:
        tmp_path = Path(tmp)
        print("下载音频…")
        mp3 = run_yt_dlp(args.url, tmp_path)
        print(f"音频: {mp3.name}")
        print("Whisper 转写…")
        text = transcribe_whisper(oai, mp3)
        if not text:
            print("转写结果为空，退出。")
            return 1

        title = mp3.stem
        chunks = chunk_text(text, args.max_chars)
        sources = [f"YouTube:{title}#part{i}" for i in range(len(chunks))]
        n = embed_chunks(
            oai,
            supabase,
            domain=args.domain,
            chunks=chunks,
            sources=sources,
        )
        print(f"完成，写入 {n} 条（domain={args.domain}）。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
