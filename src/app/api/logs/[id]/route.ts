/**
 * 单条官方日志 API：PATCH 更新，DELETE 删除。鉴权：cookie 或 x-admin-secret
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  const { id } = await params;
  let body: { title?: string; content?: string; date?: string; tags?: string[]; cover_image_url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { data, error } = await supabase()
    .from("official_logs")
    .update({
      ...(body.title != null && { title: body.title }),
      ...(body.content != null && { content: body.content }),
      ...(body.date != null && { date: body.date }),
      ...(body.tags != null && { tags: body.tags }),
      ...(body.cover_image_url != null && { cover_image_url: body.cover_image_url }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  const { id } = await params;
  const { error } = await supabaseAdmin().from("official_logs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
