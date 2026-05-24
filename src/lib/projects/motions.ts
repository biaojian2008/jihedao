import type { SupabaseClient } from "@supabase/supabase-js";
import { isShareholder } from "./roles";
import type { ProjectMemberRow } from "./types";

export async function getProjectMember(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<ProjectMemberRow | null> {
  const { data } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();
  return (data as ProjectMemberRow) ?? null;
}

export async function getShareholders(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectMemberRow[]> {
  const { data } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "active");
  return ((data ?? []) as ProjectMemberRow[]).filter((m) => isShareholder(m.role));
}

export async function checkMotionApproved(
  supabase: SupabaseClient,
  motionId: string
): Promise<{ approved: boolean; error?: string }> {
  const { data: motion, error: mErr } = await supabase
    .from("shareholder_motions")
    .select("id, project_id, status, motion_type, payload")
    .eq("id", motionId)
    .single();

  if (mErr || !motion) return { approved: false, error: "motion not found" };

  const projectId = (motion as { project_id: string }).project_id;
  const shareholders = await getShareholders(supabase, projectId);
  if (shareholders.length === 0) return { approved: false, error: "无股东" };

  const { data: votes } = await supabase
    .from("shareholder_motion_votes")
    .select("voter_id, approved")
    .eq("motion_id", motionId);

  const voteMap = new Map((votes ?? []).map((v) => [(v as { voter_id: string }).voter_id, (v as { approved: boolean }).approved]));
  const allApproved = shareholders.every((s) => voteMap.get(s.user_id) === true);
  if (!allApproved) return { approved: false };

  await supabase.from("shareholder_motions").update({ status: "approved" }).eq("id", motionId);

  const motionType = (motion as { motion_type: string }).motion_type;
  const payload = (motion as { payload: Record<string, unknown> }).payload ?? {};

  if (motionType === "rules_change" && typeof payload.rules_text === "string") {
    await supabase
      .from("projects")
      .update({ rules_text: payload.rules_text, updated_at: new Date().toISOString() })
      .eq("id", projectId);
  }

  if (motionType === "pool_amount") {
    const yearMonth = String(payload.year_month ?? "");
    const poolAmount = Number(payload.pool_amount ?? 0);
    if (yearMonth && poolAmount >= 0) {
      await supabase.from("monthly_contribution_pools").upsert(
        {
          project_id: projectId,
          year_month: yearMonth,
          pool_amount: poolAmount,
          status: "collecting",
        },
        { onConflict: "project_id,year_month" }
      );
    }
  }

  return { approved: true };
}
