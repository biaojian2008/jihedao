/**
 * GET: 项目详情
 */
import { NextRequest, NextResponse } from "next/server";
import { getDisplayNameOrDid } from "@/lib/did";
import { getProjectMember } from "@/lib/projects/motions";
import { getProfileId, getServiceSupabase, notConfigured } from "@/lib/projects/request";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const { id } = await params;
  const userId = getProfileId(request);
  const supabase = getServiceSupabase();

  const { data: project, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error || !project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const founderId = (project as { founder_id: string }).founder_id;
  const { data: founder } = await supabase
    .from("user_profiles")
    .select("id, display_name, fid, custom_did")
    .eq("id", founderId)
    .single();

  const { data: members } = await supabase
    .from("project_members")
    .select("investment_coins, contribution_coins, status")
    .eq("project_id", id)
    .eq("status", "active");

  let totalCoins = 0;
  for (const m of members ?? []) {
    totalCoins += Number((m as { investment_coins: number }).investment_coins) + Number((m as { contribution_coins: number }).contribution_coins);
  }

  const myMembership = userId ? await getProjectMember(supabase, id, userId) : null;

  return NextResponse.json({
    ...project,
    founder_name: founder
      ? getDisplayNameOrDid(founder as Parameters<typeof getDisplayNameOrDid>[0])
      : founderId.slice(0, 8),
    member_count: members?.length ?? 0,
    total_jihe_coins: totalCoins,
    my_membership: myMembership,
  });
}
