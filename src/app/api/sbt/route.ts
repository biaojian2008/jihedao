/**
 * SBT 签发
 * POST { issuerAddress, recipientAddress, recipientUserId?, tokenId, metadata, signature }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SBTService } from "@/lib/reputation/sbt-service";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let body: {
    issuerAddress?: string;
    recipientAddress?: string;
    recipientUserId?: string;
    tokenId?: string;
    metadata?: Record<string, unknown>;
    signature?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { issuerAddress, recipientAddress, recipientUserId, tokenId, metadata, signature } = body;
  if (!issuerAddress || !recipientAddress || !tokenId || !metadata || !signature) {
    return NextResponse.json(
      { error: "Missing issuerAddress, recipientAddress, tokenId, metadata or signature" },
      { status: 400 }
    );
  }

  const supabase = createClient(url, key);
  const service = new SBTService(supabase);
  const result = await service.createSBT({
    issuerAddress,
    recipientAddress,
    recipientUserId,
    tokenId,
    metadata,
    signature: signature as `0x${string}`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
