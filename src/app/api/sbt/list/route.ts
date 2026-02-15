/**
 * 用户持有的 SBT 列表
 * GET ?recipientAddress=0x... 或 ?recipientUserId=uuid
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const recipientAddress = searchParams.get("recipientAddress");
  const recipientUserId = searchParams.get("recipientUserId");

  if (!recipientAddress && !recipientUserId) {
    return NextResponse.json({ error: "Missing recipientAddress or recipientUserId" }, { status: 400 });
  }

  const supabase = createClient(url, key);
  let query = supabase
    .from("sbt_records")
    .select("id, token_id, issuer_address, metadata, issuer_score_at_mint, created_at")
    .order("created_at", { ascending: false });

  if (recipientAddress) {
    query = query.eq("recipient_address", recipientAddress);
  } else {
    query = query.eq("recipient_user_id", recipientUserId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
