"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

export function LogDetailBack() {
  const { t } = useLocale();
  return (
    <Link href="/log" className="mb-6 inline-block text-xs text-accent/80 hover:text-accent">
      ← {t("log.back")}
    </Link>
  );
}