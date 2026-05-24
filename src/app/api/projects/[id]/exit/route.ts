/**
 * POST: 成员退出
 */
import { NextRequest, NextResponse } from "next/server";
import { exitProjectMember } from "@/lib/projects/exit";
import { getProfileId, getServiceSupabase, notConfigured } from "@/lib/projects/request";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  let body: { user_id?: string };
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const targetId = body.user_id ?? userId;
  const supabase = getServiceSupabase();

  if (targetId !== userId) {
    return NextResponse.json({ error: "只能退出本人" }, { status: 403 });
  }

  const res = await exitProjectMember(supabase, projectId, targetId);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ ok: true, payout: res.payout });
}
