import OpenAI from "openai";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdmin } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

function createAgnesClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.AGNES_API_KEY ?? "",
    baseURL: "https://apihub.agnes-ai.com/v1",
  });
}

/** 用 Agnes 预处理提交内容：提取摘要、标签、相关度评分 */
async function preprocessWithAI(content: string, inputType: "url" | "text"): Promise<{
  title: string;
  summary: string;
  tags: string[];
  score: number;
  cleanContent: string;
}> {
  const agnes = createAgnesClient();
  const prompt =
    inputType === "url"
      ? `以下是从网页提取的文本内容，请分析：\n\n${content.slice(0, 6000)}`
      : `以下是用户提交的文本内容，请分析：\n\n${content.slice(0, 6000)}`;

  const resp = await agnes.chat.completions.create({
    model: "agnes-2.0-flash",
    max_tokens: 800,
    messages: [
      {
        role: "system",
        content: `你是一个知识库审核助手。分析用户提交的内容，判断其对于"普通人应对行政执法、劳动纠纷、物业冲突、警察盘查"等日常博弈场景的参考价值。

严格按以下JSON格式输出，不要有任何其他内容：
{
  "title": "简短标题（20字以内）",
  "summary": "内容摘要（100字以内，说明核心信息和实用价值）",
  "tags": ["标签1", "标签2"],
  "score": 85,
  "cleanContent": "提取后的核心内容（去掉广告、导航、无关信息后的正文，500字以内）"
}

score 评分标准（0-100）：
- 90+：有具体法条、实战话术、SOP步骤，高度实用
- 70-89：有一定参考价值，信息较具体
- 50-69：一般性信息，参考价值有限
- 50以下：与主题无关或信息过于笼统`,
      },
      { role: "user", content: prompt },
    ],
  });

  try {
    const raw = resp.choices[0]?.message?.content ?? "{}";
    const json = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()) as {
      title?: string;
      summary?: string;
      tags?: string[];
      score?: number;
      cleanContent?: string;
    };
    return {
      title: json.title ?? "未命名",
      summary: json.summary ?? "",
      tags: Array.isArray(json.tags) ? json.tags : [],
      score: typeof json.score === "number" ? json.score : 50,
      cleanContent: json.cleanContent ?? content.slice(0, 500),
    };
  } catch {
    return {
      title: "未命名",
      summary: content.slice(0, 100),
      tags: [],
      score: 50,
      cleanContent: content.slice(0, 500),
    };
  }
}

/** POST /api/canmou/survival/knowledge — 提交内容到审核队列 */
export async function POST(request: NextRequest) {
  if (!checkAdmin(request)) {
    return Response.json({ error: "无权限" }, { status: 403 });
  }

  const body = (await request.json()) as {
    input?: string;
    inputType?: "url" | "text";
    skipReview?: boolean; // 跳过审核直接入库
  };

  if (!body.input?.trim()) {
    return Response.json({ error: "请提供内容（URL 或文本）" }, { status: 400 });
  }

  const inputType = body.inputType ?? "text";
  let rawContent = body.input.trim();

  // 若是URL，尝试抓取内容
  if (inputType === "url") {
    try {
      const res = await fetch(rawContent, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; JiheBot/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      const html = await res.text();
      // 粗略提取正文（去掉HTML标签）
      rawContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 8000);
    } catch (e) {
      return Response.json({ error: `抓取URL失败：${(e as Error).message}` }, { status: 400 });
    }
  }

  // AI 预处理
  const processed = await preprocessWithAI(rawContent, inputType);

  if (body.skipReview) {
    // 直接入库
    const { data, error } = await supabase
      .from("survival_knowledge")
      .insert({
        title: processed.title,
        content: processed.cleanContent,
        tags: processed.tags,
        source: inputType === "url" ? body.input : null,
      })
      .select("id")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true, directlyAdded: true, id: data?.id, processed });
  }

  // 存入审核队列
  const { data, error } = await supabase
    .from("survival_pending")
    .insert({
      raw_input: body.input,
      input_type: inputType,
      ai_title: processed.title,
      ai_summary: processed.summary,
      ai_tags: processed.tags,
      relevance_score: processed.score,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, pendingId: data?.id, processed });
}

/** GET /api/canmou/survival/knowledge — 获取审核队列或已入库列表 */
export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) {
    return Response.json({ error: "无权限" }, { status: 403 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "pending"; // 'pending' | 'approved'

  if (type === "approved") {
    const { data, error } = await supabase
      .from("survival_knowledge")
      .select("id, title, tags, source, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ items: data ?? [] });
  }

  const { data, error } = await supabase
    .from("survival_pending")
    .select("*")
    .eq("status", "pending")
    .order("relevance_score", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: data ?? [] });
}

/** PATCH /api/canmou/survival/knowledge — 审核操作：批准或拒绝 */
export async function PATCH(request: NextRequest) {
  if (!checkAdmin(request)) {
    return Response.json({ error: "无权限" }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    action?: "approve" | "reject";
    title?: string;   // 可覆盖AI标题
    content?: string; // 可覆盖AI提取内容
    tags?: string[];
  };

  if (!body.id || !body.action) {
    return Response.json({ error: "缺少 id 或 action" }, { status: 400 });
  }

  const { data: pending } = await supabase
    .from("survival_pending")
    .select("*")
    .eq("id", body.id)
    .single();

  if (!pending) return Response.json({ error: "记录不存在" }, { status: 404 });

  if (body.action === "reject") {
    await supabase
      .from("survival_pending")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", body.id);
    return Response.json({ ok: true, action: "rejected" });
  }

  // 批准：入库到 survival_knowledge
  const row = pending as {
    ai_title: string;
    ai_summary: string;
    ai_tags: string[];
    raw_input: string;
    input_type: string;
  };
  const { error: insertErr } = await supabase.from("survival_knowledge").insert({
    title: body.title ?? row.ai_title,
    content: body.content ?? row.ai_summary,
    tags: body.tags ?? row.ai_tags,
    source: row.input_type === "url" ? row.raw_input : null,
  });

  if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 });

  await supabase
    .from("survival_pending")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", body.id);

  return Response.json({ ok: true, action: "approved" });
}

/** DELETE /api/canmou/survival/knowledge?id=xxx — 从知识库删除条目 */
export async function DELETE(request: NextRequest) {
  if (!checkAdmin(request)) {
    return Response.json({ error: "无权限" }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });

  const { error } = await supabase.from("survival_knowledge").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
