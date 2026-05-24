/**
 * POST: 股东投票 { approved: boolean }
 */
import { NextRequest, NextResponse } from "next/server";
import { checkMotionApproved, getProjectMember } from "@/lib/projects/motions";
import { isShareholder } from "@/lib/projects/roles";
import { getProfileId, getServiceSupabase, notConfigured } from "@/lib/projects/request";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; motionId: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId, motionId } = await params;

  let body: { approved?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.approved !== "boolean") {
    return NextResponse.json({ error: "approved 必填" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const actor = await getProjectMember(supabase, projectId, userId);
  if (!actor || actor.status !== "active" || !isShareholder(actor.role)) {
    return NextResponse.json({ error: "仅股东可投票" }, { status: 403 });
  }

  const { data: motion } = await supabase
    .from("shareholder_motions")
    .select("*")
    .eq("id", motionId)
    .eq("project_id", projectId)
    .single();

  if (!motion) return NextResponse.json({ error: "议案不存在" }, { status: 404 });
  if ((motion as { status: string }).status !== "pending") {
    return NextResponse.json({ error: "议案已结束" }, { status: 400 });
  }

  await supabase.from("shareholder_motion_votes").upsert(
    {
      motion_id: motionId,
      voter_id: userId,
      approved: body.approved,
    },
    { onConflict: "motion_id,voter_id" }
  );

  if (!body.approved) {
    await supabase.from("shareholder_motions").update({ status: "rejected" }).eq("id", motionId);
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  const result = await checkMotionApproved(supabase, motionId);
  return NextResponse.json({ ok: true, approved: result.approved, status: result.approved ? "approved" : "pending" });
}
