/**
 * GET: 成员列表
 * POST: 添加成员 { user_id, role }
 */
import { NextRequest, NextResponse } from "next/server";
import { enrichMemberNames } from "@/lib/projects/review";
import { getProjectMember } from "@/lib/projects/motions";
import { isShareholder } from "@/lib/projects/roles";
import type { ProjectRole } from "@/lib/projects/types";
import { getProfileId, getServiceSupabase, notConfigured } from "@/lib/projects/request";

const VALID_ROLES: ProjectRole[] = ["investor", "contributor", "temporary"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const { id } = await params;
  const supabase = getServiceSupabase();

  const { data: members, error } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", id)
    .order("joined_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await enrichMemberNames(supabase, members ?? []);
  return NextResponse.json(enriched);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (notConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  let body: { user_id?: string; role?: ProjectRole };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetUserId = body.user_id;
  const role = body.role;
  if (!targetUserId) return NextResponse.json({ error: "user_id required" }, { status: 400 });
  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "role 须为 investor / contributor / temporary" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const actor = await getProjectMember(supabase, projectId, userId);
  if (!actor || actor.status !== "active" || !isShareholder(actor.role)) {
    return NextResponse.json({ error: "仅股东可添加成员" }, { status: 403 });
  }

  const { data: profile } = await supabase.from("user_profiles").select("id").eq("id", targetUserId).single();
  if (!profile) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const { data, error } = await supabase
    .from("project_members")
    .upsert(
      {
        project_id: projectId,
        user_id: targetUserId,
        role,
        status: "active",
        exited_at: null,
      },
      { onConflict: "project_id,user_id" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
