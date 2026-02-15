/**
 * 退出帖子：解冻参与者的济和币
 * POST { user_id } => 退出
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { releaseCoins } from "@/lib/jihe-coin";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const { id: postId } = await context.params;
  let body: { user_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userId = body.user_id;
  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const supabase = createClient(url, key);

  const { data: participant, error: partErr } = await supabase
    .from("post_participants")
    .select("id, frozen_amount, status")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();

  if (partErr || !participant) {
    return NextResponse.json({ error: "Not a participant" }, { status: 404 });
  }

  const status = (participant as { status: string }).status;
  if (status !== "joined") {
    return NextResponse.json({ error: "Already exited or completed" }, { status: 400 });
  }

  const frozenAmount = Number((participant as { frozen_amount?: number }).frozen_amount ?? 0);

  const res = await releaseCoins(supabase, {
    userId,
    amount: frozenAmount,
    postId,
    reason: "参与帖子退出解冻",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: res.error ?? "Release failed" },
      { status: 500 }
    );
  }

  const { error: updateErr } = await supabase
    .from("post_participants")
    .update({ status: "exited", exited_at: new Date().toISOString() })
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
