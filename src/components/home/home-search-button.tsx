"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { IconSearch } from "@/components/layout/nav-icons";

export function HomeSearchButton() {
  const { t } = useLocale();
  return (
    <Link
      href="/community"
      className="fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-foreground/20 bg-background/95 text-foreground shadow-lg backdrop-blur transition hover:border-accent/50 hover:text-accent md:bottom-6"
      title={t("community.search")}
      aria-label={t("community.search")}
    >
      <IconSearch className="h-6 w-6" />
    </Link>
  );
}
