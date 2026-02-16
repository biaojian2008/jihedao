/**
 * 用户名片 API
 * GET: 返回 user_profiles + user_badges（含 custom_did）
 * PATCH: 本人可更新 display_name、bio、avatar_url、custom_did
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handlePatch } from "./patch-handler";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  const supabase = createClient(url, key);
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, display_name, bio, avatar_url, wallet_address, fid, custom_did, credit_score, jihe_coin_balance")
    .eq("id", id)
    .single();
  if (profileError || !profile) {
    return NextResponse.json(
      { error: profileError?.message ?? "Not found" },
      { status: 404 }
    );
  }
  const { data: badges } = await supabase
    .from("user_badges")
    .select("id, name, icon_url, description, issued_by, issued_at")
    .eq("user_id", id)
    .order("issued_at", { ascending: false });
  const normalizedBadges = (badges ?? []).map((b) => ({
    name: b.name,
    description: b.description ?? null,
    icon_url: b.icon_url ?? null,
  }));
  return NextResponse.json({
    ...profile,
    jihe_coin_balance: (profile as { jihe_coin_balance?: number }).jihe_coin_balance ?? 0,
    badges: normalizedBadges,
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return handlePatch(request, id);
}

