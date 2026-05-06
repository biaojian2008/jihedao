/**
 * 单条技能：公开 GET；PATCH 需管理员
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdmin } from "@/lib/admin-auth";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function supabaseAdmin() {
  return createClient(url, serviceKey || key);
}

const ALLOWED_DIFFICULTY = new Set(["入门", "进阶", "高级"]);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const { id } = await params;
  const supabase = createClient(url, key);
  const { data: skill, error } = await supabase
    .from("skills")
    .select("id, category_id, name, summary, content, difficulty, resources, order_num, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!skill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let category: { id: string; name: string } | null = null;
  if (skill.category_id) {
    const { data: cat } = await supabase.from("skill_categories").select("id, name").eq("id", skill.category_id).maybeSingle();
    if (cat) category = { id: String(cat.id), name: String(cat.name) };
  }
  return NextResponse.json({ skill, category });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const { id } = await params;
  let body: {
    name?: string;
    summary?: string | null;
    content?: string | null;
    difficulty?: string | null;
    resources?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.difficulty != null && body.difficulty !== "" && !ALLOWED_DIFFICULTY.has(body.difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  }
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name != null) patch.name = body.name;
  if (body.summary !== undefined) patch.summary = body.summary;
  if (body.content !== undefined) patch.content = body.content;
  if (body.difficulty !== undefined) {
    patch.difficulty = body.difficulty === "" || body.difficulty == null ? null : body.difficulty;
  }
  if (body.resources !== undefined) patch.resources = body.resources;
  const { data, error } = await supabaseAdmin().from("skills").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
