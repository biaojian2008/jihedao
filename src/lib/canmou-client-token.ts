const STORAGE_KEY = "canmou_client_token_v1";

/** 浏览器匿名标识，用于关联参谋历史记录（仅存于本机）。 */
export function getOrCreateCanmouClientToken(): string {
  if (typeof window === "undefined") return "";
  try {
    let t = localStorage.getItem(STORAGE_KEY);
    if (!t || t.length < 8) {
      t = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, t);
    }
    return t;
  } catch {
    return "";
  }
}
