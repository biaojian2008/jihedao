import OpenAI from "openai";

/**
 * 用于 text-embedding 的 OpenAI 客户端。
 * 官方：只配 OPENAI_API_KEY。
 * 聚合网关：额外配 OPENAI_BASE_URL（例如 https://api.gptsapi.net/v1，以对方文档为准）。
 */
export function createOpenAIEmbeddingsClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}
