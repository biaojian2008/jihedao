/**
 * POST: 提交月度贡献说明 { description }
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

  let body: { description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const description = (body.description ?? "").trim();
  if (!description) return NextResponse.json({ error: "贡献说明必填" }, { status: 400 });

  const supabase = getServiceSupabase();
  const member = await getProjectMember(supabase, projectId, userId);
  if (!member || member.status !== "active") {
    return NextResponse.json({ error: "非项目活跃成员" }, { status: 403 });
  }

  const { data: pool } = await supabase
    .from("monthly_contribution_pools")
    .select("status")
    .eq("id", poolId)
    .eq("project_id", projectId)
    .single();

  if (!pool) return NextResponse.json({ error: "贡献池不存在" }, { status: 404 });
  if ((pool as { status: string }).status !== "collecting") {
    return NextResponse.json({ error: "当前不在申报期" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contribution_submissions")
    .upsert(
      { pool_id: poolId, user_id: userId, description: description.slice(0, 5000) },
      { onConflict: "pool_id,user_id" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
