/**
 * GET: 股东议案列表
 * POST: 发起议案 { motion_type, payload }
 */
import { NextRequest, NextResponse } from "next/server";
import { checkMotionApproved } from "@/lib/projects/motions";
import { getProjectMember } from "@/lib/projects/motions";
import { isShareholder } from "@/lib/projects/roles";
import { getProfileId, getServiceSupabase, notConfigured } from "@/lib/projects/request";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const { id } = await params;
  const supabase = getServiceSupabase();

  const { data: motions, error } = await supabase
    .from("shareholder_motions")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const motionIds = (motions ?? []).map((m) => (m as { id: string }).id);
  const { data: votes } = motionIds.length
    ? await supabase.from("shareholder_motion_votes").select("*").in("motion_id", motionIds)
    : { data: [] };

  return NextResponse.json({
    motions: motions ?? [],
    votes: votes ?? [],
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  let body: { motion_type?: string; payload?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const motionType = body.motion_type;
  if (motionType !== "pool_amount" && motionType !== "rules_change") {
    return NextResponse.json({ error: "motion_type 无效" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const actor = await getProjectMember(supabase, projectId, userId);
  if (!actor || actor.status !== "active" || !isShareholder(actor.role)) {
    return NextResponse.json({ error: "仅股东可发起议案" }, { status: 403 });
  }

  const { data: motion, error } = await supabase
    .from("shareholder_motions")
    .insert({
      project_id: projectId,
      proposer_id: userId,
      motion_type: motionType,
      payload: body.payload ?? {},
      status: "pending",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("shareholder_motion_votes").insert({
    motion_id: (motion as { id: string }).id,
    voter_id: userId,
    approved: true,
  });

  return NextResponse.json(motion);
}
