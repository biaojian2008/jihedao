/**
 * 日志 (Log) - 官方进展流
 * 数据来自 Supabase official_logs，按时间倒序；title/content 支持多语言 { zh, en, ja }
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { LogPageTitle } from "@/components/log/log-page-title";
import { LogShareButton } from "@/components/log/log-share-button";
import { AdminLink } from "@/components/admin/admin-guard";
import { resolveText, type Locale } from "@/lib/i18n/resolve";

const placeholderLogs: { id: string; title: string; date: string; excerpt: string }[] = [
  { id: "1", title: "广元之行筹备", date: "2025-02-14", excerpt: "明日广元之行的行程与目标记录…" },
  { id: "2", title: "社区协议草案", date: "2025-02-12", excerpt: "济和 DAO 社区协作与信用协议初稿讨论。" },
];

function toLocale(v: string | undefined): Locale {
  return v === "en" || v === "ja" ? v : "zh";
}

export default async function LogPage() {
  const cookieStore = await cookies();
  const locale = toLocale(cookieStore.get("jihe_locale")?.value);
  let logs: { id: string; title: string; date: string; excerpt: string; cover_image_url?: string }[] = placeholderLogs;
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createServerSupabase();
      const { data } = await supabase
        .from("official_logs")
        .select("id, title, content, date, cover_image_url")
        .order("date", { ascending: false });
      if (data?.length) {
        logs = data.map((r) => {
          const content = resolveText(r.content, locale);
          return {
            id: r.id,
            title: resolveText(r.title, locale),
            date: r.date,
            excerpt: content.slice(0, 80) + (content.length > 80 ? "…" : ""),
            cover_image_url: r.cover_image_url ?? undefined,
          };
        });
      }
    }
  } catch {
    // keep placeholder
  }

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <LogPageTitle />
          <AdminLink
            href="/admin"
            className="rounded border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/60 transition hover:border-accent/40 hover:text-accent"
          >
            发布/管理日志
          </AdminLink>
        </div>
        <ul className="space-y-4">
          {logs.map((log) => (
            <li key={log.id} className="group flex items-start gap-2 rounded-xl border border-foreground/10 bg-black/40 transition hover:border-accent/40 hover:bg-black/60">
              <Link href={`/log/${log.id}`} className="min-w-0 flex-1 p-4">
                {log.cover_image_url && (
                  <div className="mb-3 -mx-4 -mt-4 overflow-hidden rounded-t-xl">
                    {/\.(mp4|webm|mov|ogg)(\?|$)/i.test(log.cover_image_url) ? (
                      <video src={log.cover_image_url} className="aspect-video w-full object-cover" muted playsInline />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={log.cover_image_url} alt="" className="aspect-video w-full object-cover" />
                    )}
                  </div>
                )}
                <time className="text-[10px] uppercase tracking-wider text-accent/80">
                  {log.date}
                </time>
                <h2 className="mt-1 text-base font-semibold text-foreground">
                  {log.title}
                </h2>
                <p className="mt-1 text-xs text-foreground/70 line-clamp-2">
                  {log.excerpt}
                </p>
              </Link>
              <div className="shrink-0 pt-4 pr-2" onClick={(e) => e.preventDefault()}>
                <LogShareButton logId={log.id} title={log.title} excerpt={log.excerpt} />
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
