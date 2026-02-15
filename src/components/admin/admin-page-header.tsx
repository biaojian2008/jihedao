"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export function AdminPageHeader() {
  const { t } = useLocale();
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold text-foreground">
        {t("admin.title")}
      </h1>
      <p className="mb-8 text-xs text-foreground/50">{t("admin.hint")}</p>
    </>
  );
}