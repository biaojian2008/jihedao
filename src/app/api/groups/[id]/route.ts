/** GET: Group detail with members */
import { NextRequest, NextResponse } from "next/server";
import { getDisplayNameOrDid } from "@/lib/did";
import { createClient } from "@supabase/supabase-js";
import { PROFILE_ID_COOKIE } from "@/lib/current-user";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getProfileId(req: NextRequest): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(new RegExp("(^| )" + PROFILE_ID_COOKIE + "=([^;]+)"));
  const v = m?.[2];
  if (v) {
    try {
      return decodeURIComponent(v);
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!url || !serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;
  const supabase = createClient(url, serviceKey);

  const { data: group, error: groupErr } = await supabase
    .from("groups")
    .select("id, name, created_by, created_at, updated_at, last_message_preview, last_message_at")
    .eq("id", groupId)
    .single();

  if (groupErr || !group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const { data: myMember } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  if (!myMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, role, joined_at")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  let profiles: { id: string; display_name: string | null; avatar_url: string | null; fid: string | null; custom_did: string | null }[] = [];
  if (userIds.length > 0) {
    const { data } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url, fid, custom_did")
      .in("id", userIds);
    profiles = (data ?? []).map((p) => ({ ...p, fid: p.fid ?? null, custom_did: (p as { custom_did?: string | null }).custom_did ?? null }));
  }
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  const memberList = (members ?? []).map((m) => {
    const prof = profileMap[m.user_id];
    return {
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      display_name: prof ? getDisplayNameOrDid(prof) : getDisplayNameOrDid({ id: m.user_id }),
      avatar_url: profileMap[m.user_id]?.avatar_url ?? null,
    };
  });

  return NextResponse.json({
    ...group,
    my_role: myMember.role,
    members: memberList,
  });
}
