import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { getProfileIdFromCookieHeader } from "@/lib/current-user";
import { CANMOU_FREE_QUOTA, CANMOU_PAID_COST, deductCoins, JIHE_COIN_REASONS } from "@/lib/jihe-coin";

export const maxDuration = 120;

function createAgnesClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.AGNES_API_KEY ?? "",
    baseURL: "https://apihub.agnes-ai.com/v1",
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

const SYSTEM_PROMPT = `你是"屁民生存手册"智能助手，专门帮助普通人在面对各类行政、执法、劳动、物业等日常博弈场景时，给出具体可操作的应对步骤。

你的回答必须做到：
1. 极其具体，不说废话和官话——直接给出第一步说什么、第二步做什么、第三步记录什么
2. 基于中国大陆实际法律法规和实战经验
3. 告知用户可以引用的具体法条或条款名称（如《行政处罚法》第X条）
4. 告知哪些话不能说、哪些行为会自我暴露
5. 如有知识库参考资料，优先基于参考资料回答，再结合自身知识补充

回答结构（严格按此格式）：
**场景研判**：[判断这是什么情形，对方的目的是什么]
**立即行动**：[第一步～第N步，每步写清楚说什么/做什么]
**留痕要点**：[如何记录、存证、留痕]
**法律依据**：[可引用的法条]
**注意事项**：[哪些话不说，哪些行为避免]`;

type Message = { role: "user" | "assistant"; content: string };

/** 全文检索知识库 */
async function searchKnowledge(query: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("search_survival_knowledge", {
      query_text: query.slice(0, 500),
      match_count: 4,
    });
    if (error || !data || !Array.isArray(data) || data.length === 0) return "";
    const items = data as { title: string; content: string; similarity: number }[];
    const relevant = items.filter((i) => i.similarity > 0.1);
    if (relevant.length === 0) return "";
    return (
      "\n\n【知识库参考】\n" +
      relevant.map((i) => `▌${i.title}\n${i.content}`).join("\n\n")
    );
  } catch (e) {
    console.error("searchKnowledge", e);
    return "";
  }
}

/** 查询用户参谋消息总用量 */
async function getUsageCount(userId: string): Promise<number> {
  const { data } = await supabase
    .from("canmou_usage")
    .select("message_count")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as { message_count?: number } | null)?.message_count ?? 0;
}

/** 递增用量 */
async function incrementUsage(userId: string): Promise<void> {
  const current = await getUsageCount(userId);
  await supabase.from("canmou_usage").upsert(
    { user_id: userId, message_count: current + 1, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

export async function POST(request: Request) {
  try {
    if (!process.env.AGNES_API_KEY?.trim()) {
      return Response.json({ error: "服务未配置 Agnes API Key（AGNES_API_KEY）" }, { status: 503 });
    }

    const profileId = getProfileIdFromCookieHeader(request.headers.get("cookie"));
    if (!profileId) {
      return Response.json({ error: "请先登录后再使用生存手册" }, { status: 401 });
    }

    const body = (await request.json()) as { messages?: Message[] };
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "请提供消息内容" }, { status: 400 });
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) {
      return Response.json({ error: "消息中缺少用户输入" }, { status: 400 });
    }

    // 查询用量，决定是否计费
    const usageCount = await getUsageCount(profileId);
    const isFree = usageCount < CANMOU_FREE_QUOTA;

    if (!isFree) {
      const deduct = await deductCoins(supabase, {
        userId: profileId,
        amount: CANMOU_PAID_COST,
        reason: JIHE_COIN_REASONS.CANMOU_PAID,
        referenceType: "canmou",
        referenceId: "survival",
      });
      if (!deduct.ok) {
        if (deduct.error === "insufficient balance") {
          return Response.json(
            {
              error: `济和币余额不足，已用完 ${CANMOU_FREE_QUOTA} 条免费额度，每条消息需 ${CANMOU_PAID_COST} 济和币`,
              code: "INSUFFICIENT_JIHE",
              required: CANMOU_PAID_COST,
            },
            { status: 402 }
          );
        }
        return Response.json({ error: deduct.error ?? "扣款失败" }, { status: 400 });
      }
    }

    // 检索知识库（只用最后一条用户消息检索）
    const knowledgeContext = await searchKnowledge(lastUserMsg.content);

    // 如果知识库有结果，注入到最后一条用户消息
    const augmentedMessages: Message[] = messages.map((m, i) => {
      if (i === messages.length - 1 && m.role === "user" && knowledgeContext) {
        return { ...m, content: m.content + knowledgeContext };
      }
      return m;
    });

    const agnes = createAgnesClient();
    const response = await agnes.chat.completions.create({
      model: "agnes-2.0-flash",
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...augmentedMessages,
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";

    await incrementUsage(profileId);

    const remainingFree = Math.max(0, CANMOU_FREE_QUOTA - (usageCount + 1));
    const hasKnowledge = knowledgeContext.length > 0;

    return Response.json({ content: text, remainingFree, isFree, hasKnowledge });
  } catch (error) {
    console.error("survival route error:", error);
    const raw = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: "服务暂时不可用", details: raw.slice(0, 500) },
      { status: 500 }
    );
  }
}
