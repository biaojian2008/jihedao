import OpenAI from "openai";

/**
 * 用于 text-embedding 的 OpenAI 客户端。
 * 官方：只配 OPENAI_API_KEY。
 * 聚合网关：OPENAI_BASE_URL 通常需含 `/v1`（与官方 SDK 一致），例如 https://api.gptsapi.net/v1
 */
export function createOpenAIEmbeddingsClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  let baseURL = process.env.OPENAI_BASE_URL?.trim();
  if (baseURL) {
    baseURL = baseURL.replace(/\/+$/, "");
    // 少数错误配置为 .../v1/v1；去掉重复
    if (/\/v1\/v1$/i.test(baseURL)) baseURL = baseURL.replace(/\/v1$/i, "");
  }
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}
