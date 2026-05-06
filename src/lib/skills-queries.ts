import { createServerSupabase } from "@/lib/supabase-server";

export type SkillListItem = { id: string; name: string; order_num: number };
export type SkillCategoryWithSkills = {
  id: string;
  order_num: number;
  name: string;
  description: string | null;
  skills: SkillListItem[];
};

export async function fetchSkillCategoriesWithSkills(): Promise<SkillCategoryWithSkills[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }
  try {
    const supabase = createServerSupabase();
    const { data: cats, error: catErr } = await supabase
      .from("skill_categories")
      .select("id, order_num, name, description")
      .order("order_num", { ascending: true });
    if (catErr || !cats?.length) return [];
    const { data: skills, error: skErr } = await supabase
      .from("skills")
      .select("id, category_id, name, order_num")
      .order("order_num", { ascending: true });
    if (skErr) return [];
    const byCat = new Map<string, SkillListItem[]>();
    for (const s of skills || []) {
      const cid = s.category_id as string | null;
      if (!cid) continue;
      const arr = byCat.get(cid) ?? [];
      arr.push({ id: String(s.id), name: String(s.name), order_num: Number(s.order_num) });
      byCat.set(cid, arr);
    }
    return cats.map((c) => ({
      id: String(c.id),
      order_num: Number(c.order_num),
      name: String(c.name),
      description: c.description != null ? String(c.description) : null,
      skills: byCat.get(String(c.id)) ?? [],
    }));
  } catch {
    return [];
  }
}

export type SkillDetail = {
  id: string;
  name: string;
  summary: string | null;
  content: string | null;
  difficulty: string | null;
  resources: string | null;
  category_id: string | null;
  category_name: string | null;
};

export async function fetchSkillById(id: string): Promise<SkillDetail | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const supabase = createServerSupabase();
    const { data: skill, error } = await supabase
      .from("skills")
      .select("id, name, summary, content, difficulty, resources, category_id")
      .eq("id", id)
      .maybeSingle();
    if (error || !skill) return null;
    let category_name: string | null = null;
    if (skill.category_id) {
      const { data: cat } = await supabase
        .from("skill_categories")
        .select("name")
        .eq("id", skill.category_id)
        .maybeSingle();
      category_name = cat?.name != null ? String(cat.name) : null;
    }
    return {
      id: String(skill.id),
      name: String(skill.name),
      summary: skill.summary != null ? String(skill.summary) : null,
      content: skill.content != null ? String(skill.content) : null,
      difficulty: skill.difficulty != null ? String(skill.difficulty) : null,
      resources: skill.resources != null ? String(skill.resources) : null,
      category_id: skill.category_id != null ? String(skill.category_id) : null,
      category_name,
    };
  } catch {
    return null;
  }
}
