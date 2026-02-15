/**
 * 按语言解析文案：支持 string 或 { zh?, en?, ja? } 或 JSON 字符串
 * 用于首页 CMS、日志、帖子等需要多语言全文切换的内容
 */
export type Locale = "zh" | "en" | "ja";

export function resolveText(value: unknown, locale: Locale): string {
  if (value == null) return "";
  if (typeof value === "string") {
    const s = value.trim();
    if (s.startsWith("{") && s.includes("}")) {
      try {
        const o = JSON.parse(s) as Record<string, unknown>;
        return (o[locale] as string) ?? (o.zh as string) ?? (o.en as string) ?? (o.ja as string) ?? value;
      } catch {
        return value;
      }
    }
    return value;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    return (o[locale] as string) ?? (o.zh as string) ?? (o.en as string) ?? (o.ja as string) ?? "";
  }
  return String(value);
}
