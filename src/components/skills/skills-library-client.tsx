"use client";

import { useState } from "react";
import Link from "next/link";
import type { SkillCategoryWithSkills } from "@/lib/skills-queries";

type Props = {
  categories: SkillCategoryWithSkills[];
};

export function SkillsLibraryClient({ categories }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!categories.length) {
    return (
      <p className="rounded-xl border border-foreground/10 bg-black/40 p-6 text-sm text-foreground/60">
        技能数据暂未配置。请在 Supabase 中执行迁移并刷新页面。
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((cat) => {
        const open = expandedId === cat.id;
        return (
          <div
            key={cat.id}
            className="overflow-hidden rounded-xl border border-foreground/15 bg-foreground/[0.02] transition hover:border-accent/50 hover:bg-foreground/[0.04]"
          >
            <button
              type="button"
              onClick={() => setExpandedId(open ? null : cat.id)}
              className="flex w-full items-start justify-between gap-2 p-4 text-left"
            >
              <div className="min-w-0">
                <h2 className="text-sm font-medium text-accent">{cat.name}</h2>
                {cat.description ? <p className="mt-1 text-xs text-foreground/65">{cat.description}</p> : null}
              </div>
              <span className="shrink-0 rounded-full border border-foreground/20 px-2 py-0.5 text-[10px] text-foreground/70">
                {cat.skills.length} 项
              </span>
            </button>
            {open ? (
              <ul className="border-t border-foreground/10 px-2 py-2">
                {cat.skills.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/skills/${s.id}`}
                      className="block rounded-lg px-2 py-2 text-sm text-foreground/90 transition hover:bg-foreground/5 hover:text-accent"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
