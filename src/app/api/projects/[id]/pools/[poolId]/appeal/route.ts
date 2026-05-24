/**
 * POST: 发起申诉 { reason, co_signer_ids[] }
 * POST action=finalize: 申诉期结束，无申诉则确认；或启动第二轮盲评
 * POST action=reject: 驳回申诉
 */
import { NextRequest, NextResponse } from "next/server";
import { getProjectMember } from "@/lib/projects/motions";
import { getProfileId, getServiceSupabase, notConfigured } from "@/lib/projects/request";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; poolId: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId, poolId } = await params;

  let body: { action?: string; reason?: string; co_signer_ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { data: pool } = await supabase
    .from("monthly_contribution_pools")
    .select("*")
    .eq("id", poolId)
    .eq("project_id", projectId)
    .single();

  if (!pool) return NextResponse.json({ error: "贡献池不存在" }, { status: 404 });

  const poolRow = pool as {
    status: string;
    appeal_deadline: string | null;
    review_round: number;
  };

  if (body.action === "finalize") {
    if (poolRow.status !== "appeal") {
      return NextResponse.json({ error: "当前不在申诉期" }, { status: 400 });
    }
    if (poolRow.appeal_deadline && new Date(poolRow.appeal_deadline) > new Date()) {
      return NextResponse.json({ error: "申诉期尚未结束" }, { status: 400 });
    }
    const { data: pendingAppeals } = await supabase
      .from("project_appeals")
      .select("id, status")
      .eq("pool_id", poolId)
      .eq("status", "accepted");

    if ((pendingAppeals ?? []).length > 0) {
      return NextResponse.json({ error: "存在已接受的申诉，请先完成第二轮盲评" }, { status: 400 });
    }

    await supabase.from("monthly_contribution_pools").update({ status: "settled" }).eq("id", poolId);
    return NextResponse.json({ ok: true, status: "settled" });
  }

  if (body.action === "start_round2") {
    await supabase
      .from("monthly_contribution_pools")
      .update({ status: "reviewing", review_round: 2 })
      .eq("id", poolId);
    return NextResponse.json({ ok: true });
  }

  if (poolRow.status !== "appeal") {
    return NextResponse.json({ error: "当前不在申诉期" }, { status: 400 });
  }
  if (poolRow.appeal_deadline && new Date(poolRow.appeal_deadline) < new Date()) {
    return NextResponse.json({ error: "申诉期已结束" }, { status: 400 });
  }

  const member = await getProjectMember(supabase, projectId, userId);
  if (!member || member.status !== "active") {
    return NextResponse.json({ error: "非项目成员" }, { status: 403 });
  }

  const { data: existing } = await supabase.from("project_appeals").select("id").eq("pool_id", poolId).limit(1);
  if ((existing ?? []).length > 0) {
    return NextResponse.json({ error: "本项目本月已发起过申诉，只能申诉一次" }, { status: 400 });
  }

  const reason = (body.reason ?? "").trim();
  const coSigners = (body.co_signer_ids ?? []).filter((id) => id && id !== userId);
  const uniqueCoSigners = [...new Set(coSigners)];

  if (!reason) return NextResponse.json({ error: "申诉理由必填" }, { status: 400 });
  if (uniqueCoSigners.length < 2) {
    return NextResponse.json({ error: "至少需 3 人联署（含发起人共 3 人）" }, { status: 400 });
  }

  for (const sid of uniqueCoSigners) {
    const m = await getProjectMember(supabase, projectId, sid);
    if (!m || m.status !== "active") {
      return NextResponse.json({ error: `联署人 ${sid.slice(0, 8)} 非活跃成员` }, { status: 400 });
    }
  }

  const allSigners = [userId, ...uniqueCoSigners];
  const { data: appeal, error } = await supabase
    .from("project_appeals")
    .insert({
      pool_id: poolId,
      initiator_id: userId,
      reason: reason.slice(0, 5000),
      co_signer_ids: allSigners,
      status: "accepted",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from("monthly_contribution_pools")
    .update({ status: "reviewing", review_round: 2 })
    .eq("id", poolId);

  await supabase.from("blind_review_votes").delete().eq("pool_id", poolId).eq("round", 2);

  return NextResponse.json(appeal);
}
