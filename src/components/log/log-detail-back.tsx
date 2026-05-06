"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

type Props = {
  /** 默认返回技能库列表 /log */
  href?: string;
};

export function LogDetailBack({ href = "/log" }: Props) {
  const { t } = useLocale();
  const label = href === "/" ? t("log.backHome") : t("log.backSkills");
  return (
    <Link href={href} className="mb-6 inline-block text-xs text-accent/80 hover:text-accent">
      ← {label}
    </Link>
  );
}