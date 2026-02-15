/**
 * 信誉分查询
 * GET ?address=0x... 或 ?userId=uuid
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ReputationEngine } from "@/lib/reputation/reputation-engine";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const userId = searchParams.get("userId");

  if (!address && !userId) {
    return NextResponse.json({ error: "Missing address or userId" }, { status: 400 });
  }

  const supabase = createClient(url, key);
  const engine = new ReputationEngine(supabase);

  let score: number;
  if (address) {
    score = await engine.getScore(address);
  } else if (userId) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("wallet_address")
      .eq("id", userId)
      .single();
    const addr = (profile?.wallet_address as string) ?? "";
    score = await engine.getScore(addr || userId, { recipientUserId: userId });
  } else {
    score = 0;
  }

  return NextResponse.json({ score });
}
