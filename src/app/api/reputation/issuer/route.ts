/**
 * 签发者资料（根据 issuer_address 查 user_profiles）
 * GET ?address=0x...
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
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const supabase = createClient(url, key);
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, display_name, avatar_url, bio, credit_score")
    .eq("wallet_address", address)
    .single();

  const engine = new ReputationEngine(supabase);
  const score = await engine.getScore(address);

  return NextResponse.json({
    address,
    profile: profile
      ? {
          id: profile.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          credit_score: profile.credit_score,
        }
      : null,
    reputation_score: score,
  });
}
