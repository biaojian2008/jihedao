"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { PublisherModal } from "@/components/community/publisher-modal";

export function HomePublishButton() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  return (
    <>
      <div className="fixed bottom-20 right-2 z-30 md:bottom-6 md:right-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
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
