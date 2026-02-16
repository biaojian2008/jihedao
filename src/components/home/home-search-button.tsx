"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { IconSearch } from "@/components/layout/nav-icons";

export function HomeSearchButton() {
  const { t } = useLocale();
  return (
    <Link
      href="/community"
      className="fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-black shadow-lg transition hover:opacity-90 md:bottom-6"
      title={t("community.search")}
      aria-label={t("community.search")}
    >
      <IconSearch className="h-6 w-6" />
    </Link>
  );
}
