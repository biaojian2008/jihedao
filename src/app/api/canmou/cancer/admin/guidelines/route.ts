import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdmin } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

/** GET /api/canmou/cancer/admin/guidelines — 列出全部指南（含未核实） */
export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) return Response.json({ error: "无权限" }, { status: 403 });
  const { data, error } = await supabase
    .from("cancer_guidelines")
    .select(
      "id,cancer_type,subtype,stage,source,source_url,standard_treatment,china_availability,india_availability,verified,verified_at,embedding"
    )
    .order("cancer_type", { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  // embedding 只回传是否存在，避免传输大向量
  const items = (data ?? []).map((g) => {
    const { embedding, ...rest } = g as Record<string, unknown>;
    return { ...rest, has_embedding: embedding != null };
  });
  return Response.json({ items });
}

/** PATCH /api/canmou/cancer/admin/guidelines — 人工签发/撤销：{ id, verified } */
export async function PATCH(request: NextRequest) {
  if (!checkAdmin(request)) return Response.json({ error: "无权限" }, { status: 403 });
  const body = (await request.json()) as { id?: string; verified?: boolean };
  if (!body.id || typeof body.verified !== "boolean") {
    return Response.json({ error: "缺少 id 或 verified" }, { status: 400 });
  }
  const { error } = await supabase
    .from("cancer_guidelines")
    .update({
      verified: body.verified,
      verified_at: body.verified ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

/** DELETE /api/canmou/cancer/admin/guidelines?id=xxx */
export async function DELETE(request: NextRequest) {
  if (!checkAdmin(request)) return Response.json({ error: "无权限" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });
  const { error } = await supabase.from("cancer_guidelines").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
