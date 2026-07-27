import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdmin } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

const SELECT =
  "id,name,city,jci_accredited,specialties,cost_range,reputation_score,source_reviews,intl_patient_contact,source_url,verified,verified_at,created_at";

type HospitalInput = {
  name?: string;
  city?: string;
  jci_accredited?: boolean;
  specialties?: string[];
  cost_range?: Record<string, unknown>;
  reputation_score?: number | null;
  source_reviews?: unknown;
  intl_patient_contact?: string;
  source_url?: string;
};

function sanitize(body: HospitalInput) {
  return {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.city !== undefined ? { city: body.city } : {}),
    ...(body.jci_accredited !== undefined ? { jci_accredited: !!body.jci_accredited } : {}),
    ...(Array.isArray(body.specialties)
      ? { specialties: body.specialties.map((s) => String(s).trim()).filter(Boolean) }
      : {}),
    ...(body.cost_range !== undefined ? { cost_range: body.cost_range } : {}),
    ...(body.reputation_score !== undefined
      ? { reputation_score: body.reputation_score === null ? null : Number(body.reputation_score) }
      : {}),
    ...(body.source_reviews !== undefined ? { source_reviews: body.source_reviews } : {}),
    ...(body.intl_patient_contact !== undefined
      ? { intl_patient_contact: body.intl_patient_contact }
      : {}),
    ...(body.source_url !== undefined ? { source_url: body.source_url } : {}),
  };
}

/** GET — 列出全部医院（含未核实） */
export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) return Response.json({ error: "无权限" }, { status: 403 });
  const { data, error } = await supabase
    .from("india_hospitals")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: data ?? [] });
}

/** POST — 新增医院（默认 verified=false，待核实） */
export async function POST(request: NextRequest) {
  if (!checkAdmin(request)) return Response.json({ error: "无权限" }, { status: 403 });
  const body = (await request.json()) as HospitalInput;
  if (!body.name?.trim()) return Response.json({ error: "医院名称必填" }, { status: 400 });
  const { data, error } = await supabase
    .from("india_hospitals")
    .insert({ ...sanitize(body), verified: false })
    .select("id")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, id: data?.id });
}

/** PATCH — 编辑或核实：{ id, verified?, ...fields } */
export async function PATCH(request: NextRequest) {
  if (!checkAdmin(request)) return Response.json({ error: "无权限" }, { status: 403 });
  const body = (await request.json()) as HospitalInput & { id?: string; verified?: boolean };
  if (!body.id) return Response.json({ error: "缺少 id" }, { status: 400 });
  const patch: Record<string, unknown> = {
    ...sanitize(body),
    updated_at: new Date().toISOString(),
  };
  if (typeof body.verified === "boolean") {
    patch.verified = body.verified;
    patch.verified_at = body.verified ? new Date().toISOString() : null;
  }
  const { error } = await supabase.from("india_hospitals").update(patch).eq("id", body.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

/** DELETE — ?id=xxx */
export async function DELETE(request: NextRequest) {
  if (!checkAdmin(request)) return Response.json({ error: "无权限" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });
  const { error } = await supabase.from("india_hospitals").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
