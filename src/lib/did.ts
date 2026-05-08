/**
 * 个人中心 DID 展示与校验：
 * - Farcaster 同步：`farcaster:{fid}`（fid 为数字或字符串）
 * - 非 Farcaster 自定义：存库为 handle，展示为 `jihe:{handle}`（小写）
 * - 未设置且无 Farcaster：系统分配 `jihe:{uuid十进制}`（由档案 UUID 唯一映射，非 user_ 前缀）
 */

/** 将档案 UUID 映射为稳定十进制串，展示为 jihe:{n} */
export function getSystemDid(profileId: string): string {
  if (!profileId) return "";
  const hex = profileId.replace(/-/g, "").toLowerCase();
  if (hex.length !== 32 || !/^[0-9a-f]+$/.test(hex)) return "";
  try {
    const n = BigInt(`0x${hex}`);
    return `jihe:${n.toString()}`;
  } catch {
    return "";
  }
}

/** Farcaster：`farcaster:{fid}`；自定义：`jihe:{handle}` */
export function getDisplayDid(fid: string | number | null | undefined, customDid: string | null | undefined): string {
  const fidStr = fid != null ? String(fid).trim() : "";
  if (fidStr !== "") {
    if (fidStr.toLowerCase().startsWith("farcaster:")) return fidStr;
    if (fidStr.toLowerCase().startsWith("did:farcaster:")) return `farcaster:${fidStr.slice("did:farcaster:".length)}`;
    return `farcaster:${fidStr}`;
  }
  const customStr = customDid != null ? String(customDid).trim() : "";
  if (customStr !== "") {
    const lower = customStr.toLowerCase();
    let tail = customStr.trim();
    if (lower.startsWith("did:jihe:")) tail = tail.slice(9).trim();
    else if (lower.startsWith("jihe:")) tail = tail.slice(5).trim();
    return `jihe:${tail.toLowerCase()}`;
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
  if (systemDid) return systemDid;
  const id = profile?.id ?? "";
  return id ? `jihe:${id.replace(/-/g, "").toLowerCase()}` : "";
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

/** 从完整 jihe: / did:jihe:、@handle 或纯 handle 解析出 handle（小写，无 @） */
export function normalizeCustomDidInput(input: string): string {
  let s = input.trim();
  const low = s.toLowerCase();
  if (low.startsWith("did:jihe:")) {
    s = s.slice("did:jihe:".length).trim();
  } else if (low.startsWith("jihe:")) {
    s = s.slice("jihe:".length).trim();
  }
  if (s.startsWith("@")) s = s.slice(1).trim();
  return s.toLowerCase();
}
