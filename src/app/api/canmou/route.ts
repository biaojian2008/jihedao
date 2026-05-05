import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { questionnaires, type CanmouDomain } from "@/lib/questionnaires";
import { createOpenAIEmbeddingsClient } from "@/lib/openai-embeddings";

/** 与 Claude Messages API 兼容的纯文本轮次（追问对话） */
type ClaudeTextMessage = { role: "user" | "assistant"; content: string };

export const maxDuration = 120;

/** 每次请求新建客户端，确保读到最新的 ANTHROPIC_* 环境变量（代理 Base URL 等） */
function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  const baseURL = process.env.ANTHROPIC_BASE_URL?.trim();
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

  legal: `你是济和法律参谋，专注于帮助个人了解自己的法律权利，在与系统的博弈中不处于信息劣势。你熟悉劳动、合同、房产、婚姻、公司、跨境等常见法律问题的基本框架。建议要帮助用户理解自己的权利和选项，复杂案件必须说明需要咨询持牌律师。回答分为四个部分：情况概述、权利说明、建议行动、注意事项。所有建议仅供参考，不构成法律意见。`,

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

    const body = (await request.json()) as {
      domain?: string;
      answers?: Record<string, string>;
      messages?: ClaudeTextMessage[];
    };
    const { domain: domainRaw, answers, messages } = body;
    const domain = domainRaw as CanmouDomain;

    if (!domainRaw || !systemPrompts[domain]) {
      return Response.json({ error: "未知的参谋类型" }, { status: 400 });
    }

    const systemPrompt = systemPrompts[domain];
    let finalMessages: ClaudeTextMessage[];
    let firstUserMessage: string | undefined;

    if (answers && typeof answers === "object" && !Array.isArray(answers)) {
      const formattedAnswers = formatAnswers(domain, answers);
      const relevantContent = await retrieveRelevantContent(formattedAnswers, domain);
      const userMessage = `${formattedAnswers}${relevantContent}\n\n请根据以上情况给出专业建议。`;
      firstUserMessage = userMessage;
      finalMessages = [{ role: "user", content: userMessage }];
      const { error: consultErr } = await supabase.from("consultations").insert({ domain, answers });
      if (consultErr) {
        console.error("consultations insert:", consultErr.message, consultErr);
      }
    } else if (messages && Array.isArray(messages) && messages.length > 0) {
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
      process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";

    const response = await createAnthropicClient().messages.create({
      model: modelId,
      max_tokens: 2000,
      system: systemPrompt,
      messages: finalMessages,
    });

    const block = response.content[0];
    const text = block?.type === "text" ? block.text : "";

    return Response.json({
      content: text,
      ...(firstUserMessage !== undefined ? { firstUserMessage } : {}),
    });
  } catch (error) {
    console.error(error);
    const raw = error instanceof Error ? error.message : String(error);
    const details = raw.length > 800 ? `${raw.slice(0, 800)}…` : raw;
    return Response.json(
      { error: "服务暂时不可用", details },
      { status: 500 }
    );
  }
}
