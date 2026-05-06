import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { resolveText, type Locale } from "@/lib/i18n/resolve";

export type HomeLogCard = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  cover_image_url?: string;
};

function toLocale(v: string | undefined): Locale {
  return v === "en" || v === "ja" ? v : "zh";
}

export async function fetchOfficialLogsForHome(): Promise<HomeLogCard[]> {
  try {
    const cookieStore = await cookies();
    const locale = toLocale(cookieStore.get("jihe_locale")?.value);
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return [];
    }
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("official_logs")
      .select("id, title, content, date, cover_image_url")
      .order("date", { ascending: false });
    if (!data?.length) return [];
    return data.map((r) => {
      const content = String(resolveText(r?.content, locale) ?? "");
      const title = String(resolveText(r?.title, locale) ?? "");
      return {
        id: String(r?.id ?? ""),
        title: title || "未命名",
        date: String(r?.date ?? ""),
        excerpt: content.slice(0, 80) + (content.length > 80 ? "…" : ""),
        cover_image_url: r?.cover_image_url ?? undefined,
      };
    });
  } catch {
    return [];
  }
}
