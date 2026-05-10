/**
 * 个人中心 DID 展示与校验：
 * - Farcaster 同步：`farcaster:{fid}`
 * - 非 Farcaster 自定义：存库为 handle，展示为 `jihe:{handle}`（字母数字 handle）
 * - 未设置且无 Farcaster：系统分配 `jihe:` + **7 位数字**（由档案 UUID 稳定映射）
 */

const JIHE_DIGITS = 7;
const JIHE_MOD = 10 ** JIHE_DIGITS; // 0000000–9999999

/** 系统分配：jihe: + 7 位数字（UUID 十六进制取模，稳定、简短） */
export function getSystemDid(profileId: string): string {
  if (!profileId) return "";
  const hex = profileId.replace(/-/g, "").toLowerCase();
  if (hex.length !== 32 || !/^[0-9a-f]+$/.test(hex)) return "";
  try {
    const n = BigInt(`0x${hex}`) % BigInt(JIHE_MOD);
    const digits = n.toString().padStart(JIHE_DIGITS, "0");
    return `jihe:${digits}`;
  } catch {
    return "";
  }
}

export type ResolvedDidProfile = {
  id: string;
  fid?: string | number | null;
  custom_did?: string | null;
};

/**
 * 解析最终展示的 DID（含系统分配与「误存超长数字」的兼容）
 */
export function getResolvedDid(profile: ResolvedDidProfile): string {
  const fidStr = profile.fid != null ? String(profile.fid).trim() : "";
  if (fidStr !== "") {
    if (fidStr.toLowerCase().startsWith("farcaster:")) return fidStr;
    if (fidStr.toLowerCase().startsWith("did:farcaster:")) {
      return `farcaster:${fidStr.slice("did:farcaster:".length)}`;
    }
    return `farcaster:${fidStr}`;
  }

  const raw = profile.custom_did != null ? String(profile.custom_did).trim() : "";
  if (raw !== "") {
    let tail = raw.trim();
    const lower = tail.toLowerCase();
    if (lower.startsWith("did:jihe:")) tail = tail.slice("did:jihe:".length).trim();
    else if (lower.startsWith("jihe:")) tail = tail.slice("jihe:".length).trim();
    const t = tail.toLowerCase();
    // 曾误把 UUID 转成的整串十进制写入 custom_did，改为与用户 id 一致的 7 位 jihe 号
    if (/^\d+$/.test(t) && t.length > JIHE_DIGITS) {
      return getSystemDid(profile.id);
    }
    return `jihe:${t}`;
  }

  return getSystemDid(profile.id);
}

/** 兼容旧调用：若传入 profileId，行为与 getResolvedDid 一致 */
export function getDisplayDid(
  fid: string | number | null | undefined,
  customDid: string | null | undefined,
  profileId?: string
): string {
  if (profileId) {
    return getResolvedDid({ id: profileId, fid, custom_did: customDid });
  }
  const fidStr = fid != null ? String(fid).trim() : "";
  if (fidStr !== "") {
    if (fidStr.toLowerCase().startsWith("farcaster:")) return fidStr;
    if (fidStr.toLowerCase().startsWith("did:farcaster:")) {
      return `farcaster:${fidStr.slice("did:farcaster:".length)}`;
    }
    return `farcaster:${fidStr}`;
  }
  const raw = customDid != null ? String(customDid).trim() : "";
  if (raw !== "") {
    let tail = raw.trim();
    const lower = tail.toLowerCase();
    if (lower.startsWith("did:jihe:")) tail = tail.slice("did:jihe:".length).trim();
    else if (lower.startsWith("jihe:")) tail = tail.slice("jihe:".length).trim();
    return `jihe:${tail.toLowerCase()}`;
  }
  return "";
}

/** 用于展示：优先 display_name，否则 DID（含系统分配） */
export function getDisplayNameOrDid(profile: {
  id: string;
  display_name?: string | null;
  fid?: string | number | null;
  custom_did?: string | null;
}): string {
  const name = profile?.display_name?.trim();
  if (name && name !== "匿名" && name !== "Anonymous") return name;
  return getResolvedDid(profile);
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
