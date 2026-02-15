"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { PublisherModal } from "@/components/community/publisher-modal";

export function HomePublishButton() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-black shadow-lg transition hover:opacity-90"
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
