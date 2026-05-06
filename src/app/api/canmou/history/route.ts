import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { questionnaires } from "@/lib/questionnaires";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function getClientToken(req: NextRequest): string {
  const h = req.headers.get("x-canmou-client")?.trim() ?? "";
  return h.slice(0, 128);
}

/** 列出当前浏览器（X-Canmou-Client）关联的参谋历史 */
export async function GET(req: NextRequest) {
  const token = getClientToken(req);
  if (!token || !url || !serviceKey) {
    return NextResponse.json({ items: [] as unknown[] });
  }

  const supabase = createClient(url, serviceKey);
  const { data, error } = await supabase
    .from("consultations")
    .select("id, domain, created_at, result")
    .eq("client_token", token)
    .not("result", "is", null)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("canmou history list", error);
    return NextResponse.json({ error: "读取历史失败" }, { status: 500 });
  }

  const items = (data ?? []).map((row) => {
    const raw = (row.result as string) ?? "";
    const preview = raw.replace(/\s+/g, " ").slice(0, 120);
    return {
      id: row.id,
      domain: row.domain,
      domainName: (questionnaires as Record<string, { name: string }>)[row.domain]?.name ?? row.domain,
      created_at: row.created_at,
      preview: preview.length < raw.length ? `${preview}…` : preview,
    };
  });

  return NextResponse.json({ items });
}
