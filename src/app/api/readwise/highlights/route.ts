/**
 * GET ?userId= 获取该用户的 Readwise 标注
 * 仅当 userId 与当前登录用户一致时返回（Token 不从 API 泄露）
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PROFILE_ID_COOKIE } from "@/lib/current-user";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const READWISE_API = "https://readwise.io/api/v2/highlights/";

function getProfileIdFromRequest(req: NextRequest): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(new RegExp("(^| )" + PROFILE_ID_COOKIE + "=([^;]+)"));
  const v = m?.[2];
  if (v) {
    try {
      return decodeURIComponent(v);
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  const profileId = getProfileIdFromRequest(request);
  if (!profileId || profileId !== userId) {
    return NextResponse.json({ error: "Unauthorized", hint: "只能查看自己的阅读标注" }, { status: 403 });
  }
  const supabase = createClient(url, serviceKey);
  const { data: profile, error: fetchError } = await supabase
    .from("user_profiles")
    .select("readwise_token")
    .eq("id", userId)
    .single();
  if (fetchError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  const userToken = (profile as { readwise_token?: string | null }).readwise_token;
  const websiteToken = process.env.READWISE_API_TOKEN;
  const token = (userToken && typeof userToken === "string" ? userToken : null) || (websiteToken && typeof websiteToken === "string" ? websiteToken : null);
  if (!token) {
    return NextResponse.json(
      { error: "No Readwise token", hint: "网站管理员请在环境变量配置 READWISE_API_TOKEN；或在此绑定个人 Token 以个性化" },
      { status: 400 }
    );
  }
  const params = new URLSearchParams({ page_size: "50" });
  const r = await fetch(`${READWISE_API}?${params}`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!r.ok) {
    if (r.status === 401) {
      return NextResponse.json(
        { error: "Token 无效", hint: "请检查 Readwise API Token 是否正确" },
        { status: 401 }
      );
    }
    const text = await r.text();
    return NextResponse.json(
      { error: "Readwise API 请求失败", detail: text.slice(0, 200) },
      { status: 502 }
    );
  }
  const data = (await r.json()) as { results?: Array<{
    id: string;
    text: string;
    title?: string;
    author?: string;
    highlighted_at?: string;
    book_id?: number;
    note?: string;
  }> };
  const results = data?.results ?? [];
  return NextResponse.json(
    results.map((h) => ({
      id: h.id,
      text: h.text,
      title: h.title ?? null,
      author: h.author ?? null,
      highlighted_at: h.highlighted_at ?? null,
      note: h.note ?? null,
    }))
  );
}
