#!/usr/bin/env python3
"""
批量读取文件夹内 PDF → 提取正文 → text-embedding-3-small → 写入 Supabase knowledge_base。

用法:
  python ingest_pdf_folder.py --folder "D:/pdfs" --domain immigration

依赖: pip install -r requirements.txt
环境: 同目录或项目根目录放置 .env（见 ingest_common.py 说明）。
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from pypdf import PdfReader

from ingest_common import chunk_text, embed_chunks, get_env, get_supabase, load_dotenv_safe, openai_client


def extract_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    parts: list[str] = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            parts.append(t)
    return "\n\n".join(parts).strip()


def main() -> int:
    load_dotenv_safe()
    parser = argparse.ArgumentParser(description="PDF 批量入库 knowledge_base")
    parser.add_argument("--folder", required=True, help="含 PDF 的文件夹路径")
    parser.add_argument("--domain", required=True, help="knowledge_base.domain，如 immigration")
    parser.add_argument(
        "--max-chars",
        type=int,
        default=6000,
        help="单条 content 最大字符数（过长会切块；不宜过大以免超 embedding token 限制）",
    )
    args = parser.parse_args()

    folder = Path(args.folder).expanduser().resolve()
    if not folder.is_dir():
        print(f"错误: 不是有效文件夹: {folder}", file=sys.stderr)
        return 1

    pdfs = sorted(folder.glob("*.pdf")) + sorted(folder.glob("*.PDF"))
    if not pdfs:
        print(f"未找到 PDF: {folder}")
        return 0

    get_env()
    oai = openai_client()
    supabase = get_supabase()

    total_rows = 0
    for pdf_path in pdfs:
        print(f"处理: {pdf_path.name}")
        try:
            text = extract_pdf_text(pdf_path)
        except Exception as e:
            print(f"  跳过（读取失败）: {e}", file=sys.stderr)
            continue
        if not text:
            print("  跳过（无文本）")
            continue

        chunks = chunk_text(text, args.max_chars)
        sources = [f"{pdf_path.stem}#part{i}" for i in range(len(chunks))]
        n = embed_chunks(
            oai,
            supabase,
            domain=args.domain,
            chunks=chunks,
            sources=sources,
        )
        total_rows += n
        print(f"  写入 {n} 条")

    print(f"完成，共写入 {total_rows} 条。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
