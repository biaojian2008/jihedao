"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export function DmPageTitle() {
  const { t } = useLocale();
  return (
    <h1 className="mb-6 text-xl font-semibold text-foreground">
      {t("dm.title")}
    </h1>
  );
}
