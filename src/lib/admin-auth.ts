/**
 * 管理后台认证：默认账号 admin，密码 Worisinima666666.（末尾带句号，可通过 env 覆盖）
 * 与站点用户账号分离；使用 cookie + 签名，API 支持 x-admin-secret 或 cookie 两种方式
 */
import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "jihe_admin";
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24h

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "Worisinima666666.";

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || DEFAULT_USERNAME,
    password: process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD,
  };
}

function getSecret(): string {
  const s = process.env.ADMIN_SECRET;
  if (!s) return "fallback-secret-change-me";
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createAdminCookie(): { name: string; value: string; maxAge: number } {
  const payload = JSON.stringify({
    u: getAdminCredentials().username,
    exp: Date.now() + COOKIE_MAX_AGE * 1000,
  });
  const value = Buffer.from(payload, "utf8").toString("base64url") + "." + sign(payload);
  return { name: COOKIE_NAME, value, maxAge: COOKIE_MAX_AGE };
}

export function verifyAdminCookie(request: NextRequest): boolean {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return false;
  const i = cookie.lastIndexOf(".");
  if (i <= 0) return false;
  const payload = cookie.slice(0, i);
  const sig = cookie.slice(i + 1);
  try {
    const payloadStr = Buffer.from(payload, "base64url").toString("utf8");
    const expectedSig = sign(payloadStr);
    if (expectedSig.length !== sig.length) return false;
    if (!timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))) return false;
    const data = JSON.parse(payloadStr) as { exp?: number };
    if (!data.exp || data.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

/** API 鉴权：通过 x-admin-secret 或 admin cookie */
export function checkAdmin(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (secret && request.headers.get("x-admin-secret") === secret) return true;
  return verifyAdminCookie(request);
}
