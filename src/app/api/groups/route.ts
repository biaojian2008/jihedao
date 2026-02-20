/**
 * GET: 当前用户参与的群组列表
 * POST: 创建群组 body: { name }
 */
import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  if (!url || !serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(url, serviceKey);
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);
  const groupIds = (memberships ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) return NextResponse.json([]);

  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, created_by, last_message_preview, last_message_at")
    .in("id", groupIds)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const { data: memberCounts } = await supabase
    .from("group_members")
    .select("group_id");

  const countByGroup: Record<string, number> = {};
  for (const m of memberCounts ?? []) {
    countByGroup[m.group_id] = (countByGroup[m.group_id] ?? 0) + 1;
  }

  const list = (groups ?? []).map((g) => ({
    ...g,
    member_count: countByGroup[g.id] ?? 0,
  }));
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  if (!url || !serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const userId = getProfileId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = (body.name ?? "").trim().slice(0, 100);
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const supabase = createClient(url, serviceKey);
  const { data: group, error: groupErr } = await supabase
    .from("groups")
    .insert({ name, created_by: userId })
    .select("id, name, created_by, created_at")
    .single();
  if (groupErr) return NextResponse.json({ error: groupErr.message }, { status: 500 });

  const { error: memberErr } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: userId, role: "owner" });
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });

  return NextResponse.json({ ...group, member_count: 1 });
}
