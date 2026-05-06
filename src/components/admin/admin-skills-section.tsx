"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

function apiUrl(path: string): string {
  if (typeof window === "undefined") return path;
  const base = window.location.origin;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

type ApiSkill = {
  id: string;
  category_id: string | null;
  name: string;
  order_num: number;
  summary?: string | null;
  difficulty?: string | null;
};

type ApiCategory = {
  id: string;
  order_num: number;
  name: string;
  description: string | null;
  skills: ApiSkill[];
};

const DIFF_OPTIONS = ["", "入门", "进阶", "高级"] as const;

export function AdminSkillsSection() {
  const { t } = useLocale();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    summary: "",
    content: "",
    difficulty: "",
    resources: "",
  });
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingSkill, setLoadingSkill] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadTree = useCallback(async () => {
    setLoadingTree(true);
    try {
      const r = await fetch(apiUrl("/api/skills"));
      if (!r.ok) return;
      const data = (await r.json()) as { categories?: ApiCategory[] };
      const cats = data.categories ?? [];
      setCategories(cats);
      setSelectedCatId((prev) => {
        if (prev && cats.some((c) => c.id === prev)) return prev;
        return cats[0]?.id ?? null;
      });
    } finally {
      setLoadingTree(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const selectedCat = categories.find((c) => c.id === selectedCatId) ?? null;

  const openSkill = async (skillId: string) => {
    setLoadingSkill(true);
    setEditingId(skillId);
    try {
      const r = await fetch(apiUrl(`/api/skills/${skillId}`));
      if (!r.ok) return;
      const data = (await r.json()) as {
        skill?: { name: string; summary: string | null; content: string | null; difficulty: string | null; resources: string | null };
      };
      const s = data.skill;
      if (!s) return;
      setForm({
        name: s.name,
        summary: s.summary ?? "",
        content: s.content ?? "",
        difficulty: s.difficulty ?? "",
        resources: s.resources ?? "",
      });
    } finally {
      setLoadingSkill(false);
    }
  };

  const closeEditor = () => {
    setEditingId(null);
    setForm({ name: "", summary: "", content: "", difficulty: "", resources: "" });
  };

  const save = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const r = await fetch(apiUrl(`/api/skills/${editingId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          summary: form.summary || null,
          content: form.content || null,
          difficulty: form.difficulty || null,
          resources: form.resources || null,
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        alert((e as { error?: string }).error || "保存失败");
        return;
      }
      await loadTree();
      closeEditor();
    } finally {
      setSaving(false);
    }
  };

  if (loadingTree) {
    return <p className="text-sm text-foreground/60">技能库加载中…</p>;
  }

  if (!categories.length) {
    return (
      <section className="rounded-xl border border-foreground/10 bg-black/40 p-6">
        <h2 className="mb-2 text-sm font-semibold text-accent">{t("admin.skillsTitle")}</h2>
        <p className="text-xs text-foreground/60">暂无分类数据。请先在 Supabase 执行技能库迁移。</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-foreground/10 bg-black/40 p-6">
      <h2 className="mb-4 text-sm font-semibold text-accent">{t("admin.skillsTitle")}</h2>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <nav className="flex shrink-0 flex-row flex-wrap gap-1 md:w-44 md:flex-col md:flex-nowrap">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedCatId(c.id);
                closeEditor();
              }}
              className={`rounded-lg px-3 py-2 text-left text-xs transition md:text-sm ${
                selectedCatId === c.id ? "bg-accent/20 text-accent" : "text-foreground/80 hover:bg-foreground/5"
              }`}
            >
              <span className="font-medium">{c.name}</span>
              <span className="ml-1 text-foreground/50">({c.skills.length})</span>
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 border-t border-foreground/10 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
          {!editingId ? (
            <>
              <p className="mb-3 text-xs text-foreground/50">{selectedCat?.name ?? ""} — 点击技能编辑</p>
              <ul className="space-y-1">
                {(selectedCat?.skills ?? []).map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => openSkill(s.id)}
                      className="w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm text-foreground/90 transition hover:border-foreground/15 hover:bg-black/50"
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : loadingSkill ? (
            <p className="text-sm text-foreground/60">加载技能…</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-foreground/50">编辑中</span>
                <button type="button" onClick={closeEditor} className="text-xs text-accent hover:underline">
                  返回列表
                </button>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs text-foreground/70">技能名称</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-foreground/70">简介（一句话）</span>
                <input
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-foreground/70">详细内容（Markdown）</span>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={12}
                  className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 font-mono text-xs text-foreground"
                />
              </label>
              <fieldset>
                <legend className="mb-1 text-xs text-foreground/70">难度等级</legend>
                <div className="flex flex-wrap gap-3">
                  {DIFF_OPTIONS.filter((x) => x !== "").map((d) => (
                    <label key={d} className="flex cursor-pointer items-center gap-1.5 text-sm text-foreground/85">
                      <input
                        type="radio"
                        name="skill-diff"
                        checked={form.difficulty === d}
                        onChange={() => setForm((f) => ({ ...f, difficulty: d }))}
                      />
                      {d}
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm text-foreground/85">
                    <input
                      type="radio"
                      name="skill-diff"
                      checked={!form.difficulty}
                      onChange={() => setForm((f) => ({ ...f, difficulty: "" }))}
                    />
                    未设置
                  </label>
                </div>
              </fieldset>
              <label className="block">
                <span className="mb-1 block text-xs text-foreground/70">参考资源（链接或书目）</span>
                <textarea
                  value={form.resources}
                  onChange={(e) => setForm((f) => ({ ...f, resources: e.target.value }))}
                  rows={3}
                  className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                />
              </label>
              <button
                type="button"
                disabled={saving || !form.name.trim()}
                onClick={save}
                className="rounded bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
