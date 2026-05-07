import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { getProfileIdFromCookieHeader } from "@/lib/current-user";
import {
  CANMOU_FOLLOWUP_COST,
  CANMOU_MAIN_COST,
  deductCoins,
  JIHE_COIN_REASONS,
} from "@/lib/jihe-coin";
import { questionnaires, type CanmouDomain } from "@/lib/questionnaires";
import { createOpenAIEmbeddingsClient } from "@/lib/openai-embeddings";

/** 与 Claude Messages API 兼容的纯文本轮次（追问对话） */
type ClaudeTextMessage = { role: "user" | "assistant"; content: string };

export const maxDuration = 120;

/**
 * Anthropic SDK 会在 baseURL 后追加 `/v1/messages`。
 * 若环境变量写成 `https://xxx/v1` 或误写成 `.../v1/v1`，会变成 `/v1/v1/messages` 报 404。
 */
function normalizeAnthropicBaseURL(url: string): string {
  let u = url.trim().replace(/\/+$/, "");
  while (/\/v1$/i.test(u)) {
    u = u.replace(/\/v1$/i, "").replace(/\/+$/, "");
  }
  return u;
}

/** 每次请求新建客户端，确保读到最新的 ANTHROPIC_* 环境变量（代理 Base URL 等） */
function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  const raw = process.env.ANTHROPIC_BASE_URL?.trim();
  const baseURL = raw ? normalizeAnthropicBaseURL(raw) : undefined;
  return new Anthropic({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

const openai = createOpenAIEmbeddingsClient();

const systemPrompts: Record<CanmouDomain, string> = {
  immigration: `你是济和移民参谋，专注于帮助个人实现身份多元化和自由迁徙。你熟悉全球主要移民项目，包括技术移民、投资移民、创业移民、家庭团聚等路径。你的建议要基于用户的具体情况，给出最现实可行的路径，而不是泛泛而谈。不确定的政策细节要说明建议核实最新官方信息。回答分为四个部分：情况概述、推荐路径、具体步骤、注意事项。所有建议仅供参考，不构成法律意见。`,

  assets: `你是济和资产转移参谋，专注于帮助个人合法保护和转移资产，减少对单一司法管辖区的依赖。你熟悉主要国家的外汇管制政策、离岸账户开设、信托架构等工具。建议要合法、具体、可操作。明确区分合法避税和非法逃税的边界。回答分为四个部分：情况概述、推荐路径、具体步骤、注意事项。所有建议仅供参考，不构成财务或法律意见。`,

  tax: `你是济和税务优化参谋，专注于帮助个人通过合法手段优化税务负担，实现税务主权。你熟悉CRS、双重征税协定、税务居民身份规划等核心概念。建议要合法，要有具体的操作路径，要说明不同方案的利弊。明确告知用户所有税务安排必须在合法框架内进行。回答分为四个部分：情况概述、推荐路径、具体步骤、注意事项。所有建议仅供参考，不构成税务或法律意见。`,

  offshore: `你是济和离岸公司参谋，专注于帮助个人和企业通过离岸架构实现资产保护、税务优化和国际业务拓展。你熟悉BVI、开曼、香港、新加坡等主要离岸注册地的特点和适用场景。建议要具体说明不同注册地的优劣、成本和合规要求。回答分为四个部分：情况概述、推荐路径、具体步骤、注意事项。所有建议仅供参考，不构成法律或财务意见。`,

  banking: `你是济和银行参谋，专注于帮助个人在多个司法管辖区建立银行账户，实现金融主权。你熟悉香港、新加坡、美国、欧洲等主要地区的开户要求、KYC流程和注意事项。建议要具体说明开户条件、所需材料和常见被拒原因。回答分为四个部分：情况概述、推荐路径、具体步骤、注意事项。所有建议仅供参考，具体开户流程以银行最新要求为准。`,

  legal: `你是济和法律与维权参谋，专注于帮助个人了解自己的法律权利，在与系统的博弈中不处于信息劣势。你熟悉劳动、合同、房产、婚姻、公司、跨境等常见法律问题的基本框架。建议要帮助用户理解自己的权利和选项，复杂案件必须说明需要咨询持牌律师。回答分为四个部分：情况概述、权利说明、建议行动、注意事项。所有建议仅供参考，不构成法律意见。`,

  medical: `你是济和就医参谋，专注于帮助个人在全球范围内找到最适合自己的医疗资源，不被单一医疗体系限制。你熟悉主要国家的医疗体系、就医流程、医疗旅游目的地和跨境购药的合法渠道。建议要具体说明就医流程、费用预期和注意事项。回答分为四个部分：情况概述、推荐路径、具体步骤、注意事项。所有建议仅供参考，具体医疗决策请咨询执业医师。`,

  education: `你是济和留学参谋，专注于帮助个人和家庭实现教育主权，让下一代不被单一教育体系限制。你熟悉全球主要留学目的地的申请要求、院校选择、费用规划和移民衔接路径。建议要具体说明申请时间线、所需材料和常见误区。回答分为四个部分：情况概述、推荐路径、具体步骤、注意事项。所有建议仅供参考，具体申请以各院校最新要求为准。`,
};

function formatAnswers(domain: CanmouDomain, answers: Record<string, string>): string {
  const def = questionnaires[domain];
  const lines = def.questions.map((q) => {
    const v = answers[q.id] ?? "";
    return `${q.question}：${v}`;
  });
  return `用户咨询领域：${def.name}\n用户情况：\n${lines.join("\n")}`;
}

async function retrieveRelevantContent(query: string, domain: string): Promise<string> {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query.slice(0, 8000),
    });
    const embedding = embeddingResponse.data[0].embedding;
    const { data, error } = await supabase.rpc("match_knowledge", {
      query_embedding: embedding as unknown as string,
      match_domain: domain,
      match_count: 5,
    });
    if (error) {
      console.error("match_knowledge", error);
      return "";
    }
    if (!data || !Array.isArray(data) || data.length === 0) return "";
    return "\n\n参考资料：\n" + data.map((item: { content: string }) => item.content).join("\n\n");
  } catch (e) {
    console.error("retrieveRelevantContent", e);
    return "";
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return Response.json({ error: "服务未配置 Claude（ANTHROPIC_API_KEY）" }, { status: 503 });
    }
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return Response.json(
        { error: "服务未配置 OpenAI（OPENAI_API_KEY），无法做知识库向量检索" },
        { status: 503 }
      );
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ error: "服务未配置数据库" }, { status: 503 });
    }

    const profileId = getProfileIdFromCookieHeader(request.headers.get("cookie"));
    if (!profileId) {
      return Response.json({ error: "请先登录后再使用济和参谋" }, { status: 401 });
    }

    const body = (await request.json()) as {
      domain?: string;
      answers?: Record<string, string>;
      messages?: ClaudeTextMessage[];
      clientToken?: string;
      consultationId?: string;
    };
    const { domain: domainRaw, answers, messages } = body;
    const clientToken =
      typeof body.clientToken === "string" ? body.clientToken.trim().slice(0, 128) : "";
    const domain = domainRaw as CanmouDomain;

    if (!domainRaw || !systemPrompts[domain]) {
      return Response.json({ error: "未知的参谋类型" }, { status: 400 });
    }

    const systemPrompt = systemPrompts[domain];
    let finalMessages: ClaudeTextMessage[];
    let firstUserMessage: string | undefined;
    let answersForSave: Record<string, string> | undefined;
    let followUpConsultationId: string | null = null;

    if (answers && typeof answers === "object" && !Array.isArray(answers)) {
      const deduct = await deductCoins(supabase, {
        userId: profileId,
        amount: CANMOU_MAIN_COST,
        reason: JIHE_COIN_REASONS.CANMOU_MAIN,
        referenceType: "canmou",
        referenceId: domain,
      });
      if (!deduct.ok) {
        if (deduct.error === "insufficient balance") {
          return Response.json(
            {
              error: `济和币余额不足，主咨询需 ${CANMOU_MAIN_COST} 济和币`,
              code: "INSUFFICIENT_JIHE",
              required: CANMOU_MAIN_COST,
            },
            { status: 402 }
          );
        }
        return Response.json({ error: deduct.error ?? "扣款失败" }, { status: 400 });
      }

      const formattedAnswers = formatAnswers(domain, answers);
      const relevantContent = await retrieveRelevantContent(formattedAnswers, domain);
      const userMessage = `${formattedAnswers}${relevantContent}\n\n请根据以上情况给出专业建议。`;
      firstUserMessage = userMessage;
      finalMessages = [{ role: "user", content: userMessage }];
      answersForSave = answers;
    } else if (messages && Array.isArray(messages) && messages.length > 0) {
      const lastIncoming = messages[messages.length - 1];
      if (lastIncoming?.role !== "user") {
        return Response.json({ error: "无效的消息序列" }, { status: 400 });
      }
      if (messages.length < 3) {
        return Response.json({ error: "追问需在原主咨询对话之后进行" }, { status: 400 });
      }

      const cid = typeof body.consultationId === "string" ? body.consultationId.trim() : "";
      if (!cid) {
        return Response.json({ error: "追问需关联咨询记录，请从主问卷重新生成建议后再追问" }, { status: 400 });
      }

      const { data: cons, error: consErr } = await supabase
        .from("consultations")
        .select("id, user_id, client_token")
        .eq("id", cid)
        .maybeSingle();

      if (consErr || !cons?.id) {
        return Response.json({ error: "咨询记录不存在或已失效" }, { status: 404 });
      }

      const row = cons as { id: string; user_id?: string | null; client_token?: string | null };
      const ownerUserId = row.user_id ?? null;
      const rowToken = (row.client_token ?? "").trim();
      const owned =
        (ownerUserId && ownerUserId === profileId) ||
        (!ownerUserId && Boolean(clientToken) && rowToken === clientToken);

      if (!owned) {
        return Response.json({ error: "无权在该记录下追问" }, { status: 403 });
      }

      const deduct = await deductCoins(supabase, {
        userId: profileId,
        amount: CANMOU_FOLLOWUP_COST,
        reason: JIHE_COIN_REASONS.CANMOU_FOLLOWUP,
        referenceType: "canmou",
        referenceId: cid,
      });
      if (!deduct.ok) {
        if (deduct.error === "insufficient balance") {
          return Response.json(
            {
              error: `济和币余额不足，每条追问需 ${CANMOU_FOLLOWUP_COST} 济和币`,
              code: "INSUFFICIENT_JIHE",
              required: CANMOU_FOLLOWUP_COST,
            },
            { status: 402 }
          );
        }
        return Response.json({ error: deduct.error ?? "扣款失败" }, { status: 400 });
      }

      followUpConsultationId = cid;
      finalMessages = JSON.parse(JSON.stringify(messages)) as ClaudeTextMessage[];
      const last = finalMessages[finalMessages.length - 1];
      if (last?.role === "user" && typeof last.content === "string") {
        const relevantContent = await retrieveRelevantContent(last.content, domain);
        if (relevantContent) last.content += relevantContent;
      }
    } else {
      return Response.json({ error: "请提供 answers 或 messages" }, { status: 400 });
    }

    const modelId =
      process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-sonnet-20241022";

    const response = await createAnthropicClient().messages.create({
      model: modelId,
      max_tokens: 2000,
      system: systemPrompt,
      messages: finalMessages,
    });

    const block = response.content[0];
    const text = block?.type === "text" ? block.text : "";

    let consultationId: string | undefined;

    if (answersForSave) {
      const insertRow: {
        domain: string;
        answers: Record<string, string>;
        result: string;
        client_token?: string;
        user_id: string;
      } = {
        domain,
        answers: answersForSave,
        result: text,
        user_id: profileId,
      };
      if (clientToken) insertRow.client_token = clientToken;

      const { data: inserted, error: insertErr } = await supabase
        .from("consultations")
        .insert(insertRow)
        .select("id")
        .single();

      if (insertErr) {
        console.error("consultations insert:", insertErr.message, insertErr);
      } else if (inserted?.id) {
        consultationId = inserted.id as string;
      }
    } else if (followUpConsultationId) {
      const { error: upErr } = await supabase
        .from("consultations")
        .update({ result: text })
        .eq("id", followUpConsultationId);
      if (upErr) console.error("consultations update:", upErr.message, upErr);
      else consultationId = followUpConsultationId;
    }

    return Response.json({
      content: text,
      ...(firstUserMessage !== undefined ? { firstUserMessage } : {}),
      ...(consultationId ? { consultationId } : {}),
    });
  } catch (error) {
    console.error(error);
    const raw = error instanceof Error ? error.message : String(error);
    const details = raw.length > 800 ? `${raw.slice(0, 800)}…` : raw;
    const noChannel = /model_not_found|No available channel/i.test(raw);
    const errorText = noChannel
      ? "Claude 网关返回「无可用通道」：当前账户被路由到的分发线（如 Claude-Krio 企业对接）未开通你请求的模型。这与本站代码、令牌模型白名单无关，需在蓝移侧开通对应模型通道、调整套餐/线路，或更换为其他提供 Anthropic 兼容 API 的平台并在 Vercel 配置 ANTHROPIC_API_KEY 与 ANTHROPIC_BASE_URL。"
      : "服务暂时不可用";
    return Response.json({ error: errorText, details }, { status: noChannel ? 503 : 500 });
  }
}
