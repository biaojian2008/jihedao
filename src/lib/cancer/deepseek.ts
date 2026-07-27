import OpenAI from "openai";

/**
 * DeepSeek 对话客户端（OpenAI 兼容接口）。
 * 只需配 DEEPSEEK_API_KEY；可选 DEEPSEEK_BASE_URL（默认官方）。
 * 用于癌症初筛的结构化解析与中立评估生成。
 */
export function createDeepSeekClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY ?? "",
    baseURL: process.env.DEEPSEEK_BASE_URL?.replace(/\/+$/, "") || "https://api.deepseek.com/v1",
  });
}

/** 对话与推理默认模型，可用 DEEPSEEK_MODEL 覆盖 */
export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export function hasDeepSeek(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
}
