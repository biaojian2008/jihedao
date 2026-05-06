"use client";

import { useState } from "react";
import Link from "next/link";
import type { HomeLogCard } from "@/lib/official-logs-home";
import { LogShareButton } from "@/components/log/log-share-button";
import { useLocale } from "@/lib/i18n/locale-context";

const DEFAULT_VISIBLE = 5;

type Props = {
  logs: HomeLogCard[];
};

export function HomeOfficialLogsSection({ logs }: Props) {
  const { t } = useLocale();
  const title = t("home.officialLogs");
  const [expanded, setExpanded] = useState(false);
  if (!logs.length) return null;
  const rest = logs.length - DEFAULT_VISIBLE;
  const list = expanded || rest <= 0 ? logs : logs.slice(0, DEFAULT_VISIBLE);

  return (
    <section className="mt-12 sm:mt-16">
      <h2 className="mb-4 text-lg font-semibold text-accent">{title}</h2>
      <ul className="space-y-4">
        {list.map((log) => (
          <li
            key={log.id}
            className="group flex items-start gap-2 rounded-xl border border-foreground/10 bg-black/40 transition hover:border-accent/40 hover:bg-black/60"
          >
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
              <time className="text-[10px] uppercase tracking-wider text-accent/80">{log.date}</time>
              <h3 className="mt-1 text-base font-semibold text-foreground">{log.title}</h3>
              <p className="mt-1 text-xs text-foreground/70 line-clamp-2">{log.excerpt}</p>
            </Link>
            <div className="shrink-0 pt-4 pr-2">
              <LogShareButton logId={log.id} title={log.title} excerpt={log.excerpt} />
            </div>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 w-full rounded-lg border border-foreground/15 bg-black/30 py-2.5 text-xs font-medium text-foreground/70 transition hover:border-accent/40 hover:text-accent"
        >
          {expanded ? "收起" : `展开其余 ${rest} 条`}
        </button>
      ) : null}
    </section>
  );
}
