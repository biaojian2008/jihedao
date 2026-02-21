/**
 * 个人中心 DID 展示与校验：
 * - Farcaster 登录：使用 Farcaster DID did:farcaster:{fid}
 * - 非 Farcaster：可自定义 did:jihe:{handle}，handle 需全局唯一（前端校验 + API 查重）
 * - 未设置时：系统分配 did:jihe:user_{id前8位}
 */

/** 系统分配 DID（当用户未设置 custom_did 且无 Farcaster 时） */
export function getSystemDid(profileId: string): string {
  if (!profileId || profileId.length < 8) return "";
  return `did:jihe:user_${profileId.replace(/-/g, "").slice(0, 8)}`;
}

/** Farcaster 标准：did:farcaster:<fid>；fid 可能为数字或字符串（DB/API 返回不一） */
export function getDisplayDid(fid: string | number | null | undefined, customDid: string | null | undefined): string {
  const fidStr = fid != null ? String(fid).trim() : "";
  if (fidStr !== "") {
    if (fidStr.startsWith("did:")) return fidStr;
    return `did:farcaster:${fidStr}`;
  }
  const customStr = customDid != null ? String(customDid).trim() : "";
  if (customStr !== "") {
    return `did:jihe:${customStr.toLowerCase()}`;
  }
  return "";
}

/** 用于展示：优先 display_name，否则 DID（含系统分配），永不返回空或"匿名" */
export function getDisplayNameOrDid(profile: {
  id: string;
  display_name?: string | null;
  fid?: string | number | null;
  custom_did?: string | null;
}): string {
  const name = profile?.display_name?.trim();
  if (name && name !== "匿名" && name !== "Anonymous") return name;
  const did = getDisplayDid(profile?.fid, profile?.custom_did);
  if (did) return did;
  const systemDid = getSystemDid(profile?.id ?? "");
  return systemDid || `did:jihe:user_${(profile?.id ?? "unknown").slice(0, 8)}`;
}

/**
 * 校验自定义 DID 的 handle 部分格式：@字母+数字（如 @jihe123），3–20 位
 */
export function validateCustomDidHandle(handle: string): { ok: boolean; error?: string } {
  let s = handle.trim();
  if (s.startsWith("@")) s = s.slice(1).trim();
  s = s.toLowerCase();
  if (s.length < 3 || s.length > 20) {
    return { ok: false, error: "DID 需 3–20 位（格式 @字母+数字）" };
  }
  if (!/^[a-z0-9]+$/.test(s)) {
    return { ok: false, error: "仅支持字母和数字（格式 @字母+数字，如 @jihe123）" };
  }
  if (!/[a-z]/.test(s)) {
    return { ok: false, error: "至少包含一个字母" };
  }
  return { ok: true };
}

/** 从完整 did:jihe:xxx、@handle 或纯 handle 解析出 handle（小写，无 @） */
export function normalizeCustomDidInput(input: string): string {
  let s = input.trim();
  if (s.toLowerCase().startsWith("did:jihe:")) {
    s = s.slice(9).trim();
  }
  if (s.startsWith("@")) s = s.slice(1).trim();
  return s.toLowerCase();
}
