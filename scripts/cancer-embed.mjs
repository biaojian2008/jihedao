#!/usr/bin/env node
/**
 * 用 BGE-M3（硅基流动）为 cancer_guidelines / medical_literature 中缺 embedding 的行回填 1024 维向量。
 * 用法： node scripts/cancer-embed.mjs [guidelines|literature|all]
 * 环境变量：SILICONFLOW_API_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs";

function loadEnv() {
  try {
    const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnv();

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SF_KEY = process.env.SILICONFLOW_API_KEY;
const SF_URL = (process.env.SILICONFLOW_BASE_URL || "https://api.siliconflow.cn/v1").replace(/\/+$/, "");
const MODEL = process.env.EMBEDDING_MODEL || "Qwen/Qwen3-Embedding-0.6B";
const DIM = 1024;

if (!SB_URL || !SB_KEY || !SF_KEY) {
  console.error("缺少 SILICONFLOW_API_KEY / SUPABASE 变量");
  process.exit(1);
}

const target = process.argv[2] || "all";

async function embed(text) {
  const res = await fetch(`${SF_URL}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SF_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input: text.slice(0, 8000), dimensions: DIM }),
  });
  if (!res.ok) throw new Error(`embed HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.data[0].embedding;
}

async function sb(path, init = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function backfillGuidelines() {
  const rows = await sb(
    "cancer_guidelines?embedding=is.null&select=id,cancer_type,subtype,stage,standard_treatment,china_availability,india_availability"
  );
  console.log(`cancer_guidelines 待回填：${rows.length}`);
  for (const r of rows) {
    const text = [r.cancer_type, r.subtype, r.stage, r.standard_treatment, r.china_availability, r.india_availability]
      .filter(Boolean)
      .join(" ｜ ");
    const vec = await embed(text);
    await sb(`cancer_guidelines?id=eq.${r.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ embedding: vec }),
    });
    console.log(`  ✓ ${r.cancer_type} ${r.stage || ""}`);
  }
}

async function backfillLiterature() {
  const rows = await sb("medical_literature?embedding=is.null&select=id,title,abstract");
  console.log(`medical_literature 待回填：${rows.length}`);
  for (const r of rows) {
    const vec = await embed([r.title, r.abstract].filter(Boolean).join("\n"));
    await sb(`medical_literature?id=eq.${r.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ embedding: vec }),
    });
    console.log(`  ✓ ${r.title?.slice(0, 40)}`);
  }
}

(async () => {
  if (target === "guidelines" || target === "all") await backfillGuidelines();
  if (target === "literature" || target === "all") await backfillLiterature();
  console.log("完成。");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
