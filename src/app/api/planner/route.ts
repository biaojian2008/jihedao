import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { getProfileIdFromCookieHeader } from "@/lib/current-user";
import { buildReport } from "@/lib/planner/engine";
import type { PlannerReport } from "@/lib/planner/types";

export const maxDuration = 120;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

/**
 * 规则与叙事分离：报告主体由确定性引擎生成；AI 只把引擎结果表达成
 * 通俗温暖的导读，禁止编造任何政策细节。AI 失败不影响报告产出。
 */
const NARRATIVE_SYSTEM_PROMPT = `你是一位温和、专业的国际教育规划顾问。你会收到一份由规则引擎生成的家庭全球发展规划报告数据。你的任务是为这份报告写一段 400-600 字的导读，帮家长快速理解三套方案的取舍。

严格约束：
1. 只能引用输入数据中已有的信息，禁止补充任何数据中没有的政策细节、数字、年份或国家信息。
2. 不做资格判断（引擎已完成），只做解读和情感陪伴。
3. 语气通俗温暖，像面对面聊天，避免术语堆砌。
4. 明确提醒家长：三套方案没有对错，只有取舍；标注「需人工核实」的节点在执行前务必逐项确认。
5. 直接输出导读正文，不要标题、不要客套开场白。`;

async function generateNarrative(report: PlannerReport): Promise<string | undefined> {
  if (!process.env.AGNES_API_KEY?.trim()) return undefined;
  try {
    const agnes = new OpenAI({
      apiKey: process.env.AGNES_API_KEY,
      baseURL: "https://apihub.agnes-ai.com/v1",
    });
    const digest = {
      家庭情况: report.profileSummary,
      三套方案: report.plans.map((p) => ({
        名称: p.title,
        定位: p.tagline,
        总投入区间万元: p.totalCostWan,
        全程年数: p.totalYears,
        代价: p.tradeoff,
        赌点: p.bet,
        退出机制: p.exitSummary,
        规则引擎警告: p.fitWarnings,
      })),
      需人工核实的节点: report.diagnosisNodes,
    };
    const response = await agnes.chat.completions.create({
      model: "agnes-2.0-flash",
      max_tokens: 1200,
      messages: [
        { role: "system", content: NARRATIVE_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(digest) },
      ],
    });
    return response.choices[0]?.message?.content?.trim() || undefined;
  } catch (e) {
    console.error("planner narrative:", e);
    return undefined;
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ error: "服务未配置数据库" }, { status: 503 });
    }

    const body = (await request.json()) as {
      answers?: Record<string, string>;
      clientToken?: string;
    };
    const answers = body.answers;
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return Response.json({ error: "请提供完整的测算信息" }, { status: 400 });
    }
    const clientToken =
      typeof body.clientToken === "string" ? body.clientToken.trim().slice(0, 128) : "";

    // 测算免费，不要求登录；已登录则关联用户
    const profileId = getProfileIdFromCookieHeader(request.headers.get("cookie"));

    const report = buildReport(answers);
    report.narrative = await generateNarrative(report);

    const { data: inserted, error: insertErr } = await supabase
      .from("planner_reports")
      .insert({
        answers,
        report,
        ...(clientToken ? { client_token: clientToken } : {}),
        ...(profileId ? { user_id: profileId } : {}),
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("planner_reports insert:", insertErr.message);
      // 留存失败不阻塞测算结果
      return Response.json({ report });
    }

    return Response.json({ id: inserted?.id, report });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "服务暂时不可用" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id")?.trim();
    if (!id) return Response.json({ error: "缺少报告 id" }, { status: 400 });

    const { data, error } = await supabase
      .from("planner_reports")
      .select("id, report, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return Response.json({ error: "报告不存在或已失效" }, { status: 404 });
    }
    return Response.json({ id: data.id, report: data.report, createdAt: data.created_at });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "服务暂时不可用" }, { status: 500 });
  }
}
