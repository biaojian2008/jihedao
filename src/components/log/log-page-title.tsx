"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export function LogPageTitle() {
  const { t } = useLocale();
  return (
    <h1 className="mb-8 text-2xl font-semibold text-foreground">
      {t("log.title")}
    </h1>
  );
}