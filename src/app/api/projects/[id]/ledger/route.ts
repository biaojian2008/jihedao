/**
 * GET: 项目内流水
 */
import { NextRequest, NextResponse } from "next/server";
import { getProfileId, getServiceSupabase, notConfigured } from "@/lib/projects/request";
import { getProjectMember } from "@/lib/projects/motions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;
  const memberUserId = request.nextUrl.searchParams.get("userId") ?? userId;

  const supabase = getServiceSupabase();
  const viewer = await getProjectMember(supabase, projectId, userId);
  if (!viewer || viewer.status !== "active") {
    return NextResponse.json({ error: "非项目成员" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("project_coin_ledger")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", memberUserId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
