/**
 * Privy / 微信登录后同步 user_profiles
 * POST body: { privy_user_id? } 或 { wechat_openid?, display_name?, avatar_url? }
 * 返回: { id } 对应用户档案 id；失败时返回 { error, hint? }
 * 使用 SUPABASE_SERVICE_ROLE_KEY 时 bypass RLS，避免匿名写入被拒
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const key = serviceKey || anonKey;
const rlsHint =
  !serviceKey &&
  "若报 RLS/策略错误，请在 .env.local 和 Vercel 中配置 SUPABASE_SERVICE_ROLE_KEY（Supabase 项目 Settings → API → service_role，长 JWT）。";

type Body =
  | {
      privy_user_id: string;
      wallet_address?: string;
      display_name?: string;
      avatar_url?: string;
      fid?: string | number;
    }
  | {
      wechat_openid: string;
      display_name?: string;
      avatar_url?: string;
    };

export async function POST(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createClient(url, key);
  const hint = typeof rlsHint === "string" ? rlsHint : undefined;
  const err = (message: string, status: number, h?: string) =>
    NextResponse.json({ error: message, ...(h && { hint: h }) }, { status });

  if ("wechat_openid" in body && body.wechat_openid) {
    const { wechat_openid, display_name, avatar_url } = body;
    const { data: existing } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url")
      .eq("wechat_openid", wechat_openid)
      .single();

    const updates = {
      ...(display_name != null && { display_name: display_name || null }),
      ...(avatar_url != null && { avatar_url: avatar_url || null }),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", existing.id)
        .select("id")
        .single();
      if (error) {
        return err(error.message, 500, hint);
      }
      return NextResponse.json({ id: data.id });
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        wechat_openid,
        display_name: display_name || null,
        avatar_url: avatar_url || null,
        credit_score: 50,
      })
      .select("id")
      .single();

    if (error) {
      return err(error.message, 500, hint);
    }
    return NextResponse.json({ id: data.id });
  }

  if (!("privy_user_id" in body) || !body.privy_user_id) {
    return NextResponse.json(
      { error: "Missing privy_user_id or wechat_openid" },
      { status: 400 }
    );
  }

  const { privy_user_id, wallet_address, display_name, avatar_url, fid: rawFid } = body;
  const fid =
    rawFid != null && rawFid !== ""
      ? String(typeof rawFid === "number" ? rawFid : rawFid)
      : null;

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("id, wallet_address, display_name, avatar_url, fid")
    .eq("privy_user_id", privy_user_id)
    .single();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (wallet_address !== undefined) updates.wallet_address = wallet_address || null;
  if (display_name !== undefined) updates.display_name = display_name || null;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url || null;
  if (rawFid !== undefined) updates.fid = fid;

  if (existing) {
    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) {
      return err(error.message, 500, hint);
    }
    return NextResponse.json({ id: data.id });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .insert({
      privy_user_id,
      wallet_address: wallet_address || null,
      display_name: display_name || null,
      avatar_url: avatar_url || null,
      fid,
      credit_score: 50,
    })
    .select("id")
    .single();

  if (error) {
    return err(error.message, 500, hint);
  }
  return NextResponse.json({ id: data.id });
}
