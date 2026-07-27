import OpenAI from "openai";

/**
 * BGE-M3 文本嵌入（硅基流动 SiliconFlow API，OpenAI 兼容接口）。
 * 输出 1024 维，与 cancer_guidelines / medical_literature 的 vector(1024) 对应。
 * 只需配 SILICONFLOW_API_KEY；可选 SILICONFLOW_BASE_URL / EMBEDDING_MODEL 覆盖。
 */
export function createEmbeddingsClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.SILICONFLOW_API_KEY ?? "",
    baseURL:
      process.env.SILICONFLOW_BASE_URL?.replace(/\/+$/, "") || "https://api.siliconflow.cn/v1",
  });
}

export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "Qwen/Qwen3-Embedding-0.6B";
export const EMBEDDING_DIM = 1024;

export function hasEmbeddings(): boolean {
  return Boolean(process.env.SILICONFLOW_API_KEY?.trim());
}

/** 生成单条文本的 1024 维向量；失败返回 null（检索降级为结构化匹配） */
export async function embedText(text: string): Promise<number[] | null> {
  if (!hasEmbeddings()) return null;
  try {
    const client = createEmbeddingsClient();
    const resp = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000),
      dimensions: EMBEDDING_DIM, // Qwen3-Embedding 支持自定义维度，锁定 1024 对齐数据库
    });
    const vec = resp.data[0]?.embedding;
    if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIM) return null;
    return vec as number[];
  } catch (e) {
    console.error("embedText", e);
    return null;
  }
}
