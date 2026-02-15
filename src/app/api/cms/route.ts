/**
 * 首页 CMS 配置 API
 * GET: 返回 key-value 配置
 * PATCH: 更新配置。支持单条 { key, value } 或批量 { updates: { key1: value1, ... } }。鉴权：cookie（/api/admin/login）或 x-admin-secret
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdmin } from "@/lib/admin-auth";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
/** 写 cms_config 需绕过 RLS，使用 service_role；未配置时用 anon 可能被 RLS 拒绝 */
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("cms_config")
    .select("key, value")
    .order("key");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const config: Record<string, unknown> = {};
  for (const row of data || []) {
    config[row.key] = row.value;
  }
  return NextResponse.json(config);
}

export async function PATCH(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  let body: { key?: string; value?: unknown; updates?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const supabase = createClient(url, serviceKey || key);
  const now = new Date().toISOString();

  if (body.updates && typeof body.updates === "object") {
    for (const [configKey, value] of Object.entries(body.updates)) {
      if (configKey === "" || value === undefined) continue;
      const { error } = await supabase
        .from("cms_config")
        .upsert({ key: configKey, value, updated_at: now }, { onConflict: "key" });
      if (error) {
        return NextResponse.json(
          { error: error.message, hint: serviceKey ? undefined : "若报 RLS 错误，请在环境变量中配置 SUPABASE_SERVICE_ROLE_KEY（Supabase 项目 Settings → API → service_role）。" },
          { status: 500 }
        );
      }
    }
    return NextResponse.json({ ok: true });
  }

  const { key: configKey, value } = body;
  if (!configKey || value === undefined) {
    return NextResponse.json({ error: "Missing key or value, or updates" }, { status: 400 });
  }
  const { error } = await supabase
    .from("cms_config")
    .upsert({ key: configKey, value, updated_at: now }, { onConflict: "key" });
  if (error) {
    return NextResponse.json(
      { error: error.message, hint: serviceKey ? undefined : "若报 RLS 错误，请在环境变量中配置 SUPABASE_SERVICE_ROLE_KEY（Supabase 项目 Settings → API → service_role）。" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
