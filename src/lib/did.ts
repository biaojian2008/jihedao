/**
 * 个人中心 DID 展示与校验：
 * - Farcaster 登录：使用 Farcaster DID did:farcaster:{fid}
 * - 非 Farcaster：可自定义 did:jihe:{handle}，handle 需全局唯一（前端校验 + API 查重）
 */

/** Farcaster 标准：did:farcaster:<fid>，fid 为数字 */
export function getDisplayDid(fid: string | null, customDid: string | null): string {
  if (fid != null && fid.trim() !== "") {
    const trimmed = fid.trim();
    if (trimmed.startsWith("did:")) return trimmed;
    return `did:farcaster:${trimmed}`;
  }
  if (customDid != null && customDid.trim() !== "") {
    const h = customDid.trim().toLowerCase();
    return `did:jihe:${h}`;
  }
  return "";
}

/**
 * 校验自定义 DID 的 handle 部分格式（与 Farcaster 风格一致：小写字母数字，3–20 位）
 */
export function validateCustomDidHandle(handle: string): { ok: boolean; error?: string } {
  const s = handle.trim().toLowerCase();
  if (s.length < 3 || s.length > 20) {
    return { ok: false, error: "DID 需 3–20 位" };
  }
  if (!/^[a-z0-9_]+$/.test(s)) {
    return { ok: false, error: "仅支持小写字母、数字和下划线" };
  }
  return { ok: true };
}

/** 从完整 did:jihe:xxx 或纯 handle 解析出 handle（小写） */
export function normalizeCustomDidInput(input: string): string {
  const s = input.trim();
  if (s.toLowerCase().startsWith("did:jihe:")) {
    return s.slice(9).trim().toLowerCase();
  }
  return s.toLowerCase();
}
