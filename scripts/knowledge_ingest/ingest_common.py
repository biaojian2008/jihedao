"""
两个入库脚本的共用逻辑：加载 .env、OpenAI/Supabase 客户端、切块、embedding、写入 knowledge_base。
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from supabase import Client, create_client


def load_dotenv_safe() -> None:
    """依次尝试：脚本目录、项目根目录（上两级）的 .env"""
    here = Path(__file__).resolve().parent
    roots = [here, here.parent.parent]
    for root in roots:
        env_path = root / ".env"
        if env_path.is_file():
            load_dotenv(env_path)
            return
    load_dotenv()


def get_env() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    api = os.getenv("OPENAI_API_KEY")
    if not api:
        print("错误: .env 中缺少 OPENAI_API_KEY", file=sys.stderr)
        sys.exit(1)
    if not url or not key:
        print(
            "错误: .env 需配置 SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_URL，以及 SUPABASE_SERVICE_ROLE_KEY",
            file=sys.stderr,
        )
        sys.exit(1)
    return url, key


def openai_client() -> OpenAI:
    kwargs: dict = {"api_key": os.environ["OPENAI_API_KEY"]}
    base = os.getenv("OPENAI_BASE_URL", "").strip()
    if base:
        kwargs["base_url"] = base
    return OpenAI(**kwargs)


def get_supabase() -> Client:
    url, key = get_env()
    return create_client(url, key)


def chunk_text(text: str, max_chars: int) -> list[str]:
    text = text.strip()
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]
    return [text[i : i + max_chars] for i in range(0, len(text), max_chars)]


def embed_one(client: OpenAI, text: str) -> list[float]:
    # text-embedding-3-small 约 8191 tokens；中文按保守截断避免超限
    r = client.embeddings.create(model="text-embedding-3-small", input=text[:6000])
    return list(r.data[0].embedding)


def embed_chunks(
    client: OpenAI,
    supabase: Client,
    *,
    domain: str,
    chunks: list[str],
    sources: list[str],
) -> int:
    if len(chunks) != len(sources):
        raise ValueError("chunks 与 sources 长度不一致")

    n = 0
    for content, source in zip(chunks, sources):
        if not content.strip():
            continue
        emb = embed_one(client, content)
        row = {
            "domain": domain,
            "content": content,
            "source": source,
            "embedding": emb,
        }
        try:
            supabase.table("knowledge_base").insert(row).execute()
        except Exception as e:
            print(f"Supabase 写入失败 source={source!r}: {e}", file=sys.stderr)
            raise
        n += 1
    return n
