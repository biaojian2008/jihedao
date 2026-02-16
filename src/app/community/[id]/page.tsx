/**
 * 帖子详情页；title/content 支持多语言 { zh, en, ja }，按 cookie jihe_locale 解析
 */
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { PostDetailView } from "@/components/community/post-detail-view";
import { resolveText, type Locale } from "@/lib/i18n/resolve";

type Props = { params: Promise<{ id: string }> };

function toLocale(v: string | undefined): Locale {
  return v === "en" || v === "ja" ? v : "zh";
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const locale = toLocale(cookieStore.get("jihe_locale")?.value);
  let post: {
    id: string;
    author_id: string;
    type: string;
    title: string;
    content: string;
    tags: string[] | null;
    created_at: string;
    author_name: string;
    author_credit: number;
    author_collateral?: number;
    participant_freeze?: number;
    expected_duration?: string;
    returns_description?: string;
    repay_when?: string;
    details?: string;
    contract_text?: string;
    participants_count?: number;
  } | null = null;

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("posts")
        .select("id, author_id, type, title, content, tags, created_at, author_collateral, participant_freeze, expected_duration, returns_description, repay_when, details, contract_text")
        .eq("id", id)
        .single();
      if (error || !data) {
        if (error?.code === "PGRST116") notFound();
        throw error;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name, credit_score")
        .eq("id", data.author_id)
        .single();
      const { count } = await supabase
        .from("post_participants")
        .select("id", { count: "exact", head: true })
        .eq("post_id", id)
        .eq("status", "joined");
      post = {
        id: data.id,
        author_id: data.author_id,
        type: data.type,
        title: resolveText(data.title, locale),
        content: resolveText(data.content, locale),
        tags: data.tags,
        created_at: data.created_at,
        author_name: (profile?.display_name as string) ?? "匿名",
        author_credit: (profile?.credit_score as number) ?? 0,
        author_collateral: Number((data as { author_collateral?: number }).author_collateral) || 0,
        participant_freeze: Number((data as { participant_freeze?: number }).participant_freeze) || 0,
        expected_duration: (data as { expected_duration?: string }).expected_duration || "",
        returns_description: (data as { returns_description?: string }).returns_description || "",
        repay_when: (data as { repay_when?: string }).repay_when || "",
        details: (data as { details?: string }).details || "",
        contract_text: (data as { contract_text?: string }).contract_text || "",
        participants_count: count ?? 0,
      };
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "PGRST116") notFound();
  }

  if (!post) notFound();

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16" style={{ paddingBottom: "max(5rem, calc(5rem + env(safe-area-inset-bottom, 0)))" }}>
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <PostDetailView post={post} />
      </main>
    </div>
  );
}
