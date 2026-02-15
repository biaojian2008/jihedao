/**
 * Privy / 微信登录后同步 user_profiles
 * POST body: { privy_user_id? } 或 { wechat_openid?, display_name?, avatar_url? }
 * 返回: { id } 对应用户档案 id
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Body =
  | {
      privy_user_id: string;
      wallet_address?: string;
      display_name?: string;
      avatar_url?: string;
      fid?: string;
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
        return NextResponse.json({ error: error.message }, { status: 500 });
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ id: data.id });
  }

  if (!("privy_user_id" in body) || !body.privy_user_id) {
    return NextResponse.json(
      { error: "Missing privy_user_id or wechat_openid" },
      { status: 400 }
    );
  }

  const { privy_user_id, wallet_address, display_name, avatar_url, fid } = body;

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("id, wallet_address, display_name, avatar_url, fid")
    .eq("privy_user_id", privy_user_id)
    .single();

  const updates = {
    ...(wallet_address != null && { wallet_address: wallet_address || null }),
    ...(display_name != null && { display_name: display_name || null }),
    ...(avatar_url != null && { avatar_url: avatar_url || null }),
    ...(fid != null && { fid: fid || null }),
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
      return NextResponse.json({ error: error.message }, { status: 500 });
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
      fid: fid || null,
      credit_score: 50,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
