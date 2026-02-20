/**
 * 单条日志详情；title/content 支持多语言 { zh, en, ja }
 */
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { LogDetailBack } from "@/components/log/log-detail-back";
import { LogShareButton } from "@/components/log/log-share-button";
import { resolveText, type Locale } from "@/lib/i18n/resolve";

type Props = { params: Promise<{ id: string }> };

const fallbackLog = {
  title: "广元之行筹备",
  date: "2025-02-14",
  content: "明日广元之行的行程与目标记录。\n\n我们将与当地伙伴就协作与信用实验进行交流，并记录在官方日志中。",
  tags: ["出行", "协作"],
};

function toLocale(v: string | undefined): Locale {
  return v === "en" || v === "ja" ? v : "zh";
}

export default async function LogDetailPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const locale = toLocale(cookieStore.get("jihe_locale")?.value);
  let log: { title: string; date: string; content: string; tags: string[]; cover_image_url?: string } = fallbackLog;
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("official_logs")
        .select("title, content, date, tags, cover_image_url")
        .eq("id", id)
        .single();
      if (!error && data) {
        log = {
          title: resolveText(data.title, locale),
          date: data.date,
          content: resolveText(data.content, locale),
          tags: (data.tags as string[]) || [],
          cover_image_url: data.cover_image_url ?? undefined,
        };
      } else if (error?.code === "PGRST116") {
        notFound();
      }
    }
  } catch {
    // use fallback
  }

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-2">
          <LogDetailBack />
          <LogShareButton logId={id} title={log.title} text={log.content.slice(0, 100)} />
        </div>
        <article>
          {log.cover_image_url && (
            <div className="-mx-0 mb-6 overflow-hidden rounded-xl border border-foreground/10">
              {/\.(mp4|webm|mov|ogg)(\?|$)/i.test(log.cover_image_url) ? (
                <video src={log.cover_image_url} className="aspect-video w-full object-cover" controls playsInline />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={log.cover_image_url} alt="" className="w-full object-cover" />
              )}
            </div>
          )}
          <time className="text-[10px] uppercase tracking-wider text-accent/80">
            {log.date}
          </time>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{log.title}</h1>
          {log.tags?.length ? (
            <div className="mt-2 flex gap-2">
              {log.tags.map((t) => (
                <span
                  key={t}
                  className="rounded border border-foreground/20 px-2 py-0.5 text-[10px] text-foreground/70"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-6 whitespace-pre-wrap text-sm text-foreground/90">
            {log.content}
          </div>
        </article>
      </main>
    </div>
  );
}
