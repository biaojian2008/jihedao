"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type Variant = "home" | "logs" | "log-detail";

type Props = {
  variant: Variant;
  logId?: string;
  logData?: { title: string; date: string; content: string; tags: string[]; cover_image_url?: string };
  buttonLabel?: string;
};

const CMS_KEYS = [
  "hero_image_url",
  "hero_title",
  "hero_title_highlight",
  "hero_subtitle",
  "hero_description",
  "hero_cta_primary",
  "hero_cta_secondary",
  "galt_gulch_image_url",
  "camp_image_url",
  "intro_title",
  "intro_body",
  "bottom_one_title",
  "bottom_one_body",
  "bottom_two_title",
  "bottom_three_title",
  "bottom_four_title",
  "bottom_four_lead",
] as const;

const CMS_LABELS: Record<string, string> = {
  hero_image_url: "Hero 大图 URL",
  hero_title: "主标题",
  hero_title_highlight: "高亮词",
  hero_subtitle: "副标题",
  hero_description: "描述",
  hero_cta_primary: "主按钮",
  hero_cta_secondary: "次按钮",
  galt_gulch_image_url: "营地图片 URL",
  camp_image_url: "落地实体营地图",
  intro_title: "介绍标题",
  intro_body: "介绍正文",
  bottom_one_title: "板块一标题",
  bottom_one_body: "板块一正文",
  bottom_two_title: "板块二标题",
  bottom_three_title: "板块三标题",
  bottom_four_title: "板块四标题",
  bottom_four_lead: "板块四副标题",
};

const DEFAULT_HIGHLIGHTS = [
  { key: "COLLABORATION", title: "协作即资产", body: "通过项目、任务与课程，将松散关系沉淀为可追踪的协作网络。" },
  { key: "CREDIT", title: "信用驱动排序", body: "基于行为与贡献的信用分，决定你在时间线与检索中的位置。" },
  { key: "SOCIAL", title: "交流即协商室", body: "每一段对话都可以成为签署合约前的谈判记录，未来可选择链上加密存证。" },
  { key: "SOVEREIGN DATA", title: "数据主权在你手里", body: "所有内容托管在你可控的 Supabase 实例中，为未来迁移与自托管预留空间。" },
];

function apiUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return path.startsWith("/") ? `${window.location.origin}${path}` : `${window.location.origin}/${path}`;
}

export function AdminInlineEdit({ variant, logId, logData, buttonLabel }: Props) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [cms, setCms] = useState<Record<string, unknown>>({});
  const [highlights, setHighlights] = useState(DEFAULT_HIGHLIGHTS.map((h) => ({ ...h })));
  const [logs, setLogs] = useState<{ id: string; title: string; date: string; content: string; tags: string[]; cover_image_url?: string }[]>([]);
  const [logForm, setLogForm] = useState({
    id: null as string | null,
    title: "",
    date: new Date().toISOString().slice(0, 10),
    content: "",
    tags: "",
    cover_image_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(apiUrl("/api/admin/me"), { credentials: "include" })
      .then((r) => setIsAdmin(r.ok))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (!open || !isAdmin) return;
    setLoading(true);
    const load = async () => {
      if (variant === "home") {
        const r = await fetch(apiUrl("/api/cms"), { credentials: "include" });
        if (r.ok) {
          const data = await r.json();
          setCms(data);
          if (Array.isArray(data.highlights) && data.highlights.length > 0) {
            setHighlights(data.highlights);
          }
        }
      } else if (variant === "logs" || variant === "log-detail") {
        const r = await fetch(apiUrl("/api/logs"), { credentials: "include" });
        if (r.ok) {
          const data = await r.json();
          setLogs(data || []);
        }
        if (variant === "log-detail" && logId && logData) {
          setLogForm({
            id: logId,
            title: logData.title,
            date: logData.date,
            content: logData.content,
            tags: logData.tags?.join(", ") ?? "",
            cover_image_url: logData.cover_image_url ?? "",
          });
        } else {
          setLogForm({
            id: null,
            title: "",
            date: new Date().toISOString().slice(0, 10),
            content: "",
            tags: "",
            cover_image_url: "",
          });
        }
      }
      setLoading(false);
    };
    load();
  }, [open, isAdmin, variant, logId, logData]);

  const saveCms = async () => {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      CMS_KEYS.forEach((k) => {
        updates[k] = cms[k] ?? "";
      });
      updates.highlights = highlights;
      const r = await fetch(apiUrl("/api/cms"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ updates }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        alert(e?.error ?? "保存失败");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const saveLog = async () => {
    if (!logForm.title.trim() || !logForm.content.trim() || !logForm.date) {
      alert("请填写标题、日期和正文");
      return;
    }
    setSaving(true);
    try {
      const tags = logForm.tags.split(/[,，\s]+/).filter(Boolean);
      const payload = {
        title: logForm.title,
        content: logForm.content,
        date: logForm.date,
        tags,
        cover_image_url: logForm.cover_image_url || null,
      };
      const url = logForm.id ? apiUrl(`/api/logs/${logForm.id}`) : apiUrl("/api/logs");
      const method = logForm.id ? "PATCH" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        alert(e?.error ?? "保存失败");
        return;
      }
      setOpen(false);
      setLogForm({ id: null, title: "", date: new Date().toISOString().slice(0, 10), content: "", tags: "", cover_image_url: "" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const deleteLog = async (id: string) => {
    if (!confirm("确定删除？")) return;
    const r = await fetch(apiUrl(`/api/logs/${id}`), { method: "DELETE", credentials: "include" });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      alert(e?.error ?? "删除失败");
      return;
    }
    setLogs((prev) => prev.filter((l) => l.id !== id));
    if (logForm.id === id) setLogForm({ id: null, title: "", date: new Date().toISOString().slice(0, 10), content: "", tags: "", cover_image_url: "" });
    router.refresh();
  };

  if (isAdmin !== true) return null;

  const label = buttonLabel ?? (variant === "home" ? "编辑首页" : variant === "log-detail" ? "编辑日志" : "编辑 / 发布日志");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/60 transition hover:border-accent/40 hover:text-accent"
      >
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/95">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-foreground/20 bg-black/90 px-4 py-3">
            <h2 className="text-sm font-semibold text-accent">{label}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-2 text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mx-auto max-w-2xl p-4 pb-20">
            {loading ? (
              <p className="py-8 text-center text-sm text-foreground/60">加载中…</p>
            ) : variant === "home" ? (
              <div className="space-y-4">
                {CMS_KEYS.map((key) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs text-foreground/70">{CMS_LABELS[key] ?? key}</label>
                    {key === "intro_body" ? (
                      <textarea
                        value={String(cms[key] ?? "")}
                        onChange={(e) => setCms((p) => ({ ...p, [key]: e.target.value }))}
                        rows={4}
                        className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                      />
                    ) : (
                      <input
                        type="text"
                        value={String(cms[key] ?? "")}
                        onChange={(e) => setCms((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                      />
                    )}
                  </div>
                ))}
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-accent">四卡片</h3>
                  {highlights.map((h, i) => (
                    <div key={i} className="mb-3 rounded border border-foreground/20 bg-black/60 p-3 space-y-2">
                      <input
                        type="text"
                        value={h.key}
                        onChange={(e) => setHighlights((p) => p.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}
                        placeholder="key"
                        className="w-full rounded border border-foreground/20 bg-black/80 px-2 py-1.5 text-xs text-foreground"
                      />
                      <input
                        type="text"
                        value={h.title}
                        onChange={(e) => setHighlights((p) => p.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                        placeholder="标题"
                        className="w-full rounded border border-foreground/20 bg-black/80 px-2 py-1.5 text-sm text-foreground"
                      />
                      <textarea
                        value={h.body}
                        onChange={(e) => setHighlights((p) => p.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))}
                        placeholder="正文"
                        rows={2}
                        className="w-full rounded border border-foreground/20 bg-black/80 px-2 py-1.5 text-xs text-foreground"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveCms}
                  className="rounded bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {saving ? "保存中…" : "保存"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <input
                    placeholder="标题"
                    value={logForm.title}
                    onChange={(e) => setLogForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                  />
                  <input
                    type="date"
                    value={logForm.date}
                    onChange={(e) => setLogForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                  />
                  <textarea
                    placeholder="正文"
                    value={logForm.content}
                    onChange={(e) => setLogForm((f) => ({ ...f, content: e.target.value }))}
                    rows={6}
                    className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                  />
                  <input
                    placeholder="标签（逗号分隔）"
                    value={logForm.tags}
                    onChange={(e) => setLogForm((f) => ({ ...f, tags: e.target.value }))}
                    className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                  />
                  <input
                    placeholder="封面图 URL"
                    value={logForm.cover_image_url}
                    onChange={(e) => setLogForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                    className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveLog}
                    className="rounded bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    {saving ? "保存中…" : logForm.id ? "更新" : "新建"}
                  </button>
                  {logForm.id && (
                    <button
                      type="button"
                      onClick={() => setLogForm({ id: null, title: "", date: new Date().toISOString().slice(0, 10), content: "", tags: "", cover_image_url: "" })}
                      className="rounded border border-foreground/20 px-4 py-2 text-sm"
                    >
                      取消编辑
                    </button>
                  )}
                </div>
                {variant === "logs" && (
                  <ul className="mt-6 space-y-2 border-t border-foreground/10 pt-4">
                    {logs.map((log) => (
                      <li key={log.id} className="flex items-center justify-between rounded border border-foreground/10 px-3 py-2 text-xs">
                        <span className="text-foreground">{log.title}</span>
                        <span className="text-foreground/50">{log.date}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setLogForm({
                                id: log.id,
                                title: log.title,
                                date: log.date,
                                content: log.content,
                                tags: (log.tags || []).join(", "),
                                cover_image_url: log.cover_image_url || "",
                              })
                            }
                            className="text-accent hover:underline"
                          >
                            编辑
                          </button>
                          <button type="button" onClick={() => deleteLog(log.id)} className="text-red-400 hover:underline">
                            删除
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
