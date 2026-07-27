import { createClient } from "@supabase/supabase-js";
import { getProfileIdFromCookieHeader } from "@/lib/current-user";
import {
  CANMOU_FREE_QUOTA,
  CANMOU_PAID_COST,
  deductCoins,
  JIHE_COIN_REASONS,
} from "@/lib/jihe-coin";
import { createDeepSeekClient, DEEPSEEK_MODEL, hasDeepSeek } from "@/lib/cancer/deepseek";
import { embedText } from "@/lib/cancer/embeddings";
import { cancerQuestions, type CancerParsed } from "@/lib/cancer/questionnaire";

export const maxDuration = 120;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

const DISCLAIMER =
  "以上内容由 AI 依据公开诊疗指南整理，仅为信息梳理与对比，不构成医疗诊断或建议，也不代表任何倾向性结论。所有诊断与治疗决策请以持证医生为准。跨境就医涉及药品合法性、随访衔接等风险，请务必与主治医生充分沟通。";

const SCREEN_SYSTEM_PROMPT = `你是「济和癌症国际就医参谋」，只做信息梳理与中立对比，绝不下诊断，绝不给出「值不值得去印度/出国」这类倾向性结论。

严格遵守：
1. 只把国内标准路径、国际指南要点、可及性与费用客观并列呈现，让患者和其主治医生自行判断。
2. 涉及具体方案时，说明「以最新指南与主治医生评估为准」，不替代医生决策。
3. 不夸大印度或任何地区的疗效，不做营销式表述。
4. 如信息不足，明确指出需要补充什么、建议寻求持证医生的第二诊疗意见。
5. 全程使用中文，语气克制、事实优先。

输出结构（用小标题分段）：
【情况梳理】客观复述患者结构化信息
【国内标准路径与大致成本】基于参考资料
【国际指南要点与其它地区可及性】基于参考资料，中立并列，不做推荐
【信息缺口与下一步】需要补充的检查/信息、建议咨询的方向
不要输出免责声明（系统会自动附加）。`;

type ScreenBody = {
  action?: "parse" | "screen";
  answers?: Record<string, string>;
  parsed?: CancerParsed;
  clientToken?: string;
};

function answersToText(answers: Record<string, string>): string {
  return cancerQuestions
    .map((q) => `${q.question}\n答：${answers[q.id] ?? "（未填）"}`)
    .join("\n\n");
}

/** DeepSeek 结构化解析（返回给前端供人工确认） */
async function parseStructured(answers: Record<string, string>): Promise<CancerParsed> {
  const ds = createDeepSeekClient();
  const resp = await ds.chat.completions.create({
    model: DEEPSEEK_MODEL,
    max_tokens: 600,
    messages: [
      {
        role: "system",
        content: `你是医学信息结构化助手。从患者填写的问卷与报告文本中，提取结构化字段。严格只输出 JSON，不要任何多余文字：
{"cancer_type":"癌症类型","subtype":"病理亚型或基因突变，无则空串","stage":"分期","key_markers":"关键指标(基因/受体/转移部位等)，无则空串","prior_lines":"既往治疗线数与结果的一句话概述，无则空串"}
只做客观提取，不推断、不补充患者未提供的信息。`,
      },
      { role: "user", content: answersToText(answers) },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? "{}";
  try {
    const j = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()) as Partial<CancerParsed>;
    return {
      cancer_type: j.cancer_type ?? answers.cancer_type ?? "",
      subtype: j.subtype ?? "",
      stage: j.stage ?? answers.stage ?? "",
      key_markers: j.key_markers ?? "",
      prior_lines: j.prior_lines ?? "",
    };
  } catch {
    return {
      cancer_type: answers.cancer_type ?? "",
      subtype: answers.subtype ?? "",
      stage: answers.stage ?? "",
      key_markers: "",
      prior_lines: "",
    };
  }
}

type GuidelineRow = {
  id: string;
  cancer_type: string;
  subtype: string | null;
  stage: string | null;
  source: string;
  source_url: string | null;
  standard_treatment: string | null;
  china_availability: string | null;
  india_availability: string | null;
};

/** 结构化匹配 + 向量检索指南（verified=true） */
async function retrieveGuidelines(parsed: CancerParsed): Promise<GuidelineRow[]> {
  const collected = new Map<string, GuidelineRow>();

  // 1. 结构化精确/模糊匹配（按癌种）
  if (parsed.cancer_type) {
    const { data } = await supabase
      .from("cancer_guidelines")
      .select(
        "id,cancer_type,subtype,stage,source,source_url,standard_treatment,china_availability,india_availability"
      )
      .eq("verified", true)
      .ilike("cancer_type", `%${parsed.cancer_type}%`)
      .limit(8);
    for (const r of (data ?? []) as GuidelineRow[]) collected.set(r.id, r);
  }

  // 2. 向量语义检索（补召回；embedding 缺失则跳过）
  const queryText = [parsed.cancer_type, parsed.subtype, parsed.stage, parsed.key_markers]
    .filter(Boolean)
    .join(" ");
  const vec = await embedText(queryText);
  if (vec) {
    const { data } = await supabase.rpc("match_cancer_guidelines", {
      query_embedding: vec as unknown as string,
      match_count: 5,
      filter_cancer_type: null,
    });
    for (const r of (data ?? []) as GuidelineRow[]) {
      if (!collected.has(r.id)) collected.set(r.id, r);
    }
  }

  return Array.from(collected.values()).slice(0, 6);
}

/** 匹配已核实的印度医院（擅长该癌种） */
async function matchHospitals(cancerType: string) {
  if (!cancerType) return [];
  const { data } = await supabase
    .from("india_hospitals")
    .select("id,name,city,jci_accredited,specialties,cost_range,reputation_score,intl_patient_contact,source_url")
    .eq("verified", true)
    .limit(20);
  const list = (data ?? []) as Array<{
    id: string;
    name: string;
    specialties: string[] | null;
    [k: string]: unknown;
  }>;
  return list.filter(
    (h) => Array.isArray(h.specialties) && h.specialties.some((s) => cancerType.includes(s) || s.includes(cancerType))
  );
}

async function getUsageCount(userId: string): Promise<number> {
  const { data } = await supabase
    .from("canmou_usage")
    .select("message_count")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as { message_count?: number } | null)?.message_count ?? 0;
}

async function incrementUsage(userId: string): Promise<void> {
  const current = await getUsageCount(userId);
  await supabase.from("canmou_usage").upsert(
    { user_id: userId, message_count: current + 1, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

export async function POST(request: Request) {
  try {
    if (!hasDeepSeek()) {
      return Response.json({ error: "服务未配置 DeepSeek（DEEPSEEK_API_KEY）" }, { status: 503 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ error: "服务未配置数据库" }, { status: 503 });
    }

    const profileId = getProfileIdFromCookieHeader(request.headers.get("cookie"));
    if (!profileId) {
      return Response.json({ error: "请先登录后再使用癌症就医参谋" }, { status: 401 });
    }

    const body = (await request.json()) as ScreenBody;
    const action = body.action ?? "parse";
    const answers = body.answers;
    if (!answers || typeof answers !== "object") {
      return Response.json({ error: "缺少问卷答案" }, { status: 400 });
    }

    // ── 步骤一：结构化解析（免费，供人工确认）──
    if (action === "parse") {
      const parsed = await parseStructured(answers);
      return Response.json({ parsed });
    }

    // ── 步骤二：初筛评估（计费）──
    const parsed = body.parsed;
    if (!parsed || typeof parsed !== "object") {
      return Response.json({ error: "缺少已确认的解析结果" }, { status: 400 });
    }

    const usageCount = await getUsageCount(profileId);
    const isFree = usageCount < CANMOU_FREE_QUOTA;
    if (!isFree) {
      const deduct = await deductCoins(supabase, {
        userId: profileId,
        amount: CANMOU_PAID_COST,
        reason: JIHE_COIN_REASONS.CANMOU_PAID,
        referenceType: "canmou",
        referenceId: "cancer",
      });
      if (!deduct.ok) {
        if (deduct.error === "insufficient balance") {
          return Response.json(
            {
              error: `济和币余额不足，已用完 ${CANMOU_FREE_QUOTA} 条免费额度，本次需 ${CANMOU_PAID_COST} 济和币`,
              code: "INSUFFICIENT_JIHE",
              required: CANMOU_PAID_COST,
            },
            { status: 402 }
          );
        }
        return Response.json({ error: deduct.error ?? "扣款失败" }, { status: 400 });
      }
    }

    const guidelines = await retrieveGuidelines(parsed);
    const hospitals = await matchHospitals(parsed.cancer_type);

    const referenceBlock = guidelines.length
      ? guidelines
          .map(
            (g, i) =>
              `资料${i + 1}（${g.source}）｜${g.cancer_type}${g.subtype ? " / " + g.subtype : ""}${g.stage ? " / " + g.stage : ""}\n标准方案要点：${g.standard_treatment ?? "（无）"}\n中国可及性：${g.china_availability ?? "（无）"}\n其它地区可及性：${g.india_availability ?? "（无）"}\n来源链接：${g.source_url ?? "（无）"}`
          )
          .join("\n\n")
      : "（知识库暂无匹配到的已核实指南，请在评估中明确说明信息不足，并建议寻求持证医生的第二诊疗意见。）";

    const userMessage = `患者结构化信息：
癌症类型：${parsed.cancer_type}
病理亚型/突变：${parsed.subtype || "未提供"}
分期：${parsed.stage}
关键指标：${parsed.key_markers || "未提供"}
既往治疗：${parsed.prior_lines || "未提供"}
本次关注：${answers.core_concern || "未提供"}
预算区间：${answers.budget || "未提供"}

参考资料（仅使用以下已核实资料，不要编造资料以外的具体数字或方案）：
${referenceBlock}

请据此做中立的信息梳理与对比。`;

    const ds = createDeepSeekClient();
    const response = await ds.chat.completions.create({
      model: DEEPSEEK_MODEL,
      max_tokens: 2000,
      messages: [
        { role: "system", content: SCREEN_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });
    const text = response.choices[0]?.message?.content ?? "";

    await incrementUsage(profileId);

    // 保存去隐私化咨询记录
    const clientToken =
      typeof body.clientToken === "string" ? body.clientToken.trim().slice(0, 128) : "";
    let consultationId: string | undefined;
    const { data: inserted, error: insErr } = await supabase
      .from("cancer_consultations")
      .insert({
        user_id: profileId,
        client_token: clientToken || null,
        cancer_type: parsed.cancer_type,
        stage: parsed.stage,
        input_summary: `${parsed.cancer_type} / ${parsed.stage} / ${parsed.subtype || "无亚型"}`,
        parsed,
        screening_result: text,
        recommended_hospitals: hospitals.map((h) => h.id),
      })
      .select("id")
      .single();
    if (insErr) console.error("cancer_consultations insert:", insErr.message);
    else consultationId = inserted?.id as string;

    const remainingFree = Math.max(0, CANMOU_FREE_QUOTA - (usageCount + 1));

    return Response.json({
      content: text,
      disclaimer: DISCLAIMER,
      guidelines: guidelines.map((g) => ({
        source: g.source,
        source_url: g.source_url,
        cancer_type: g.cancer_type,
        subtype: g.subtype,
        stage: g.stage,
      })),
      hospitals,
      remainingFree,
      isFree,
      ...(consultationId ? { consultationId } : {}),
    });
  } catch (error) {
    console.error(error);
    const raw = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "服务暂时不可用", details: raw.slice(0, 500) }, { status: 500 });
  }
}
