/**
 * 技能库树：公开 GET，分类及下属技能（不含正文）
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const supabase = createClient(url, key);
  const { data: cats, error: e1 } = await supabase
    .from("skill_categories")
    .select("id, order_num, name, description")
    .order("order_num", { ascending: true });
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
  const { data: skills, error: e2 } = await supabase
    .from("skills")
    .select("id, category_id, name, order_num, summary, difficulty")
    .order("order_num", { ascending: true });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  const byCat = new Map<string, typeof skills>();
  for (const s of skills || []) {
    const cid = s.category_id;
    if (!cid) continue;
    const arr = byCat.get(cid) ?? [];
    arr.push(s);
    byCat.set(cid, arr);
  }
  const categories = (cats || []).map((c) => ({
    ...c,
    skills: byCat.get(c.id) ?? [],
  }));
  return NextResponse.json({ categories });
}
