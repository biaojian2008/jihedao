/**
 * 参加帖子：冻结参与者的济和币
 * GET ?userId=xxx => { joined: boolean }
 * POST { user_id } => 参加
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { freezeCoins } from "@/lib/jihe-coin";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const { id: postId } = await context.params;
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ joined: false });
  }
  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("post_participants")
    .select("status")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();
  return NextResponse.json({
    joined: (data as { status?: string } | null)?.status === "joined",
  });
}

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

  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("id, author_id, participant_freeze")
    .eq("id", postId)
    .single();

  if (postErr || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if ((post.author_id as string) === userId) {
    return NextResponse.json({ error: "Cannot join own post" }, { status: 400 });
  }

  const freezeAmount = Number((post as { participant_freeze?: number }).participant_freeze ?? 0);
  if (freezeAmount <= 0) {
    return NextResponse.json(
      { error: "This post has no participant freeze requirement" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("post_participants")
    .select("id, status")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();

  if (existing && (existing as { status: string }).status === "joined") {
    return NextResponse.json({ error: "Already joined" }, { status: 400 });
  }

  const res = await freezeCoins(supabase, {
    userId,
    amount: freezeAmount,
    postId,
    reason: "参与帖子冻结",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: res.error ?? "Freeze failed" },
      { status: 400 }
    );
  }

  const { error: insertErr } = await supabase.from("post_participants").upsert(
    {
      post_id: postId,
      user_id: userId,
      frozen_amount: freezeAmount,
      status: "joined",
      exited_at: null,
    },
    { onConflict: "post_id,user_id" }
  );

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
