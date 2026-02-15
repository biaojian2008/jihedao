"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold text-foreground">
        {t("notFound.title")}
      </h1>
      <Link href="/" className="text-sm text-accent hover:underline">
        {t("notFound.back")}
      </Link>
    </div>
  );
}
