/**
 * 当前用户 profile id：Privy 登录后通过 /api/users/sync 获得并存入 localStorage + cookie
 * 未登录时可使用 NEXT_PUBLIC_DEFAULT_AUTHOR_ID 作为演示用户
 * API 通过 cookie 校验当前用户以允许更新个人资料、上传头像等
 */
const STORAGE_KEY = "jihe_profile_id";
export const PROFILE_ID_COOKIE = "jihe_profile_id";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export function getCurrentProfileId(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  return process.env.NEXT_PUBLIC_DEFAULT_AUTHOR_ID ?? null;
}

export function setCurrentProfileId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
  document.cookie = `${PROFILE_ID_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}
