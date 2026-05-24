/**
 * POST: 投资 { amount, target_user_id? }
 */
import { NextRequest, NextResponse } from "next/server";
import { addInvestmentCoins } from "@/lib/projects/coin";
import { getProjectMember } from "@/lib/projects/motions";
import { getProfileId, getServiceSupabase, notConfigured } from "@/lib/projects/request";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  let body: { amount?: number; target_user_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "投资金额须大于 0" }, { status: 400 });
  }

  const targetUserId = body.target_user_id ?? userId;
  const supabase = getServiceSupabase();

  let member = await getProjectMember(supabase, projectId, targetUserId);
  if (!member && targetUserId === userId) {
    const { data: inserted } = await supabase
      .from("project_members")
      .insert({ project_id: projectId, user_id: targetUserId, role: "investor" })
      .select("*")
      .single();
    member = inserted as typeof member;
  }
  if (!member || member.status !== "active") {
    return NextResponse.json({ error: "目标用户非项目活跃成员" }, { status: 400 });
  }

  if (targetUserId !== userId) {
    const actor = await getProjectMember(supabase, projectId, userId);
    if (!actor || actor.status !== "active" || (actor.role !== "founder" && actor.role !== "investor")) {
      return NextResponse.json({ error: "仅可为本人投资，或股东代为录入" }, { status: 403 });
    }
  }

  const res = await addInvestmentCoins(supabase, {
    projectId,
    userId: targetUserId,
    amount,
    reason: `投资录入 ${amount} 元（1:1 济和币）`,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
