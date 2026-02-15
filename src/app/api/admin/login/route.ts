import { NextRequest, NextResponse } from "next/server";
import { getAdminCredentials, createAdminCookie } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { username, password } = getAdminCredentials();
  if (body.username !== username || body.password !== password) {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }
  const { name, value, maxAge } = createAdminCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(name, value, {
    path: "/",
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res;
}
