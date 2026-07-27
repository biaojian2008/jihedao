#!/usr/bin/env node
/**
 * PubMed 文献拉取（NCBI E-utilities，官方免费合法接口，非爬虫）。
 * 流程：esearch（按关键词检索 PMID）→ efetch（取标题+摘要）。
 *
 * 用法：
 *   node scripts/pubmed-fetch.mjs "non-small cell lung cancer EGFR exon20 treatment" --type "非小细胞肺癌" --n 10
 *   # 加 --insert 直接写入 Supabase medical_literature（需 .env.local 里的 SUPABASE 变量）
 *
 * 环境变量：
 *   PUBMED_API_KEY（可选，提高频率限制）
 *   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY（--insert 时需要）
 */
import { readFileSync } from "node:fs";

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

// ── 解析参数 ──
const args = process.argv.slice(2);
const query = args.find((a) => !a.startsWith("--"));
const getOpt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const cancerType = getOpt("type", null);
const retmax = parseInt(getOpt("n", "10"), 10);
const doInsert = args.includes("--insert");

if (!query) {
  console.error('用法: node scripts/pubmed-fetch.mjs "<检索词>" [--type "癌种"] [--n 10] [--insert]');
  process.exit(1);
}

// ── 从 .env.local 简单读取（不引入依赖）──
function loadEnv() {
  try {
    const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* .env.local 不存在时忽略 */
  }
}
loadEnv();

const apiKey = process.env.PUBMED_API_KEY?.trim();
const keyParam = apiKey ? `&api_key=${apiKey}` : "";

async function esearch(term) {
  const url = `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&retmax=${retmax}&term=${encodeURIComponent(term)}${keyParam}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`esearch HTTP ${res.status}`);
  const json = await res.json();
  return json.esearchresult?.idlist ?? [];
}

async function efetch(ids) {
  const url = `${EUTILS}/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(",")}${keyParam}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`efetch HTTP ${res.status}`);
  return res.text();
}

/** 极简 XML 提取（避免引入解析依赖；够用于标题/摘要/日期） */
function parseArticles(xml) {
  const out = [];
  const blocks = xml.split(/<PubmedArticle>/).slice(1);
  for (const b of blocks) {
    const pmid = (b.match(/<PMID[^>]*>(\d+)<\/PMID>/) || [])[1] || null;
    const title = decode((b.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/) || [])[1] || "").trim();
    const abstractParts = [...b.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)].map((m) =>
      decode(m[1]).trim()
    );
    const abstract = abstractParts.join("\n");
    const year = (b.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/) || [])[1];
    const month = (b.match(/<PubDate>[\s\S]*?<Month>(\w+)<\/Month>/) || [])[1];
    out.push({
      pubmed_id: pmid,
      title,
      abstract,
      publication_date: year ? `${year}-${monthNum(month)}-01` : null,
      source_url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null,
      cancer_type: cancerType,
    });
  }
  return out;
}

function decode(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
function monthNum(m) {
  const map = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  if (!m) return "01";
  if (/^\d+$/.test(m)) return String(m).padStart(2, "0");
  return map[m.slice(0, 3)] || "01";
}

async function insertToSupabase(rows) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("缺少 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY，无法 --insert");
    return;
  }
  const res = await fetch(`${url}/rest/v1/medical_literature?on_conflict=pubmed_id`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows.filter((r) => r.pubmed_id)),
  });
  if (!res.ok) {
    console.error("插入失败：", res.status, await res.text());
  } else {
    console.log(`已写入/更新 ${rows.length} 条到 medical_literature（embedding 仍为空，稍后用 cancer-embed.mjs 回填）`);
  }
}

// ── 主流程 ──
(async () => {
  console.log(`检索：${query}`);
  const ids = await esearch(query);
  console.log(`命中 ${ids.length} 篇 PMID`);
  if (ids.length === 0) return;
  const xml = await efetch(ids);
  const articles = parseArticles(xml);
  console.log(JSON.stringify(articles, null, 2));
  if (doInsert) await insertToSupabase(articles);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
