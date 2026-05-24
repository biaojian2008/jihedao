"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { PublisherModal } from "@/components/community/publisher-modal";

export function HomePublishButton() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLocale();
  return (
    <>
      <div className="fixed bottom-20 right-2 z-30 md:bottom-6 md:right-3">
        {menuOpen && (
          <div className="absolute bottom-10 right-0 mb-1 w-36 rounded-lg border border-foreground/20 bg-background py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setOpen(true);
              }}
              className="block w-full px-3 py-2 text-left text-xs hover:bg-foreground/10"
            >
              社区发帖
            </button>
            <Link
              href="/projects/new"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-xs hover:bg-foreground/10"
            >
              发起项目
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/80 text-base font-bold text-black shadow transition hover:opacity-90 md:h-8 md:w-8"
          title={t("community.publish")}
          aria-label={t("community.publish")}
        >
          +
        </button>
      </div>
      <PublisherModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
