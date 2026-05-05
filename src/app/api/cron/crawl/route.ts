import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

const crawlTargets = [
  { domain: "immigration", url: "https://www.canada.ca/en/immigration-refugees-citizenship.html", name: "加拿大移民局" },
  { domain: "immigration", url: "https://immi.homeaffairs.gov.au", name: "澳大利亚移民局" },
  { domain: "immigration", url: "https://www.ica.gov.sg", name: "新加坡移民局" },
  { domain: "immigration", url: "https://www.uscis.gov", name: "美国移民局" },
  { domain: "tax", url: "https://www.ird.gov.hk", name: "香港税务局" },
  { domain: "tax", url: "https://www.iras.gov.sg", name: "新加坡税务局" },
  { domain: "offshore", url: "https://www.cr.gov.hk", name: "香港公司注册处" },
  { domain: "offshore", url: "https://www.acra.gov.sg", name: "新加坡会计与企业管制局" },
  { domain: "banking", url: "https://www.hkma.gov.hk", name: "香港金融管理局" },
  { domain: "banking", url: "https://www.mas.gov.sg", name: "新加坡金融管理局" },
  { domain: "legal", url: "https://www.doj.gov.hk", name: "香港律政司" },
  { domain: "education", url: "https://www.educanada.ca", name: "加拿大留学" },
  { domain: "medical", url: "https://www.moh.gov.sg", name: "新加坡卫生部" },
];

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

  if (!process.env.OPENAI_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "环境变量未配置" }, { status: 503 });
  }

  for (const target of crawlTargets) {
    const content = await crawlUrl(target.url);
    if (content) {
      await embedAndStore(content, target.domain, target.name);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return Response.json({ success: true, time: new Date().toISOString() });
}
