"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { IconSearch } from "@/components/layout/nav-icons";

export function HomeSearchButton() {
  const { t } = useLocale();
  return (
    <Link
      href="/community"
      className="fixed bottom-20 left-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-accent/80 text-black shadow transition hover:opacity-90 md:bottom-6 md:left-3 md:h-8 md:w-8"
      title={t("community.search")}
      aria-label={t("community.search")}
    >
      <IconSearch className="h-3.5 w-3.5 md:h-4 md:w-4" />
    </Link>
  );
}
