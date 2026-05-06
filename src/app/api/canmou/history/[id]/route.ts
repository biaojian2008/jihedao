import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { questionnaires } from "@/lib/questionnaires";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function getClientToken(req: NextRequest): string {
  return (req.headers.get("x-canmou-client")?.trim() ?? "").slice(0, 128);
}

/** 单条参谋历史详情（须匹配 X-Canmou-Client） */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = getClientToken(req);
  if (!id || !token || !url || !serviceKey) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  const supabase = createClient(url, serviceKey);
  const { data, error } = await supabase
    .from("consultations")
    .select("id, domain, created_at, result, answers")
    .eq("id", id)
    .eq("client_token", token)
    .maybeSingle();

  if (error) {
    console.error("canmou history detail", error);
    return NextResponse.json({ error: "读取失败" }, { status: 500 });
  }
  if (!data?.result) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    domain: data.domain,
    domainName: (questionnaires as Record<string, { name: string }>)[data.domain]?.name ?? data.domain,
    created_at: data.created_at,
    result: data.result as string,
    answers: data.answers,
  });
}
