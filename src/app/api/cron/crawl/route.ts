import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import { createOpenAIEmbeddingsClient } from "@/lib/openai-embeddings";
import { crawlTargetsSeed } from "@/app/api/cron/crawl-targets.seed";

export const maxDuration = 800;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

const openai = createOpenAIEmbeddingsClient();

type CrawlTarget = { domain: string; url: string; name: string };

/** 同一 domain 下 name 重复时保留先出现的条目（与 knowledge_base.source 去重一致） */
function dedupeCrawlTargets(rows: CrawlTarget[]): CrawlTarget[] {
  const seen = new Set<string>();
  const out: CrawlTarget[] = [];
  for (const r of rows) {
    const k = `${r.domain}:${r.name}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

const crawlTargets = dedupeCrawlTargets(crawlTargetsSeed);

async function crawlUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JiheDAO-Bot/1.0)" },
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header, aside").remove();
    return $("main, article, .content, body")
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
  } catch {
    return "";
  }
}

async function embedAndStore(content: string, domain: string, source: string): Promise<void> {
  if (!content || content.length < 100) return;
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
    });
    const embedding = embeddingResponse.data[0].embedding;
    const { data: existing } = await supabase
      .from("knowledge_base")
      .select("id")
      .eq("domain", domain)
      .eq("source", source)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from("knowledge_base")
        .update({ content, embedding: embedding as unknown as string, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("knowledge_base").insert({
        domain,
        content,
        embedding: embedding as unknown as string,
        source,
      });
    }
  } catch (error) {
    console.error(`处理失败：${source}`, error);
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "未授权" }, { status: 401 });
  }

  if (
    !process.env.OPENAI_API_KEY?.trim() ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return Response.json({ error: "环境变量未配置（需 OPENAI_API_KEY 与 Supabase）" }, { status: 503 });
  }

  for (const target of crawlTargets) {
    const content = await crawlUrl(target.url);
    if (content) {
      await embedAndStore(content, target.domain, target.name);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return Response.json({ success: true, time: new Date().toISOString() });
}
