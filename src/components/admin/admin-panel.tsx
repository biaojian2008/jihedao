"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

/** 浏览器端用当前 origin，避免相对路径在部分环境下 Failed to fetch */
function apiUrl(path: string): string {
  if (typeof window === "undefined") return path;
  const base = window.location.origin;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

const CMS_KEYS = [
  "hero_image_url",
  "hero_title",
  "hero_title_highlight",
  "hero_subtitle",
  "hero_description",
  "hero_cta_primary",
  "hero_cta_secondary",
  "galt_gulch_image_url",
  "camp_media_urls",
  "intro_title",
  "intro_body",
] as const;

const CMS_LABELS: Record<string, string> = {
  hero_image_url: "Hero 大图 URL",
  hero_title: "主标题",
  hero_title_highlight: "高亮词（可选）",
  hero_subtitle: "副标题",
  hero_description: "描述段落",
  hero_cta_primary: "主按钮文案",
  hero_cta_secondary: "次按钮文案",
  galt_gulch_image_url: "现实中的济和营地图片 URL",
  camp_media_urls: "落地实体营地照片/视频（可多选）",
  intro_title: "我们的介绍标题",
  intro_body: "我们的介绍正文",
};

const DEFAULT_HIGHLIGHTS: { key: string; title: string; body: string }[] = [
  { key: "COLLABORATION", title: "协作即资产", body: "通过项目、任务与课程，将松散关系沉淀为可追踪的协作网络。" },
  { key: "CREDIT", title: "信用驱动排序", body: "基于行为与贡献的信用分，决定你在时间线与检索中的位置。" },
  { key: "SOCIAL", title: "交流即协商室", body: "每一段对话都可以成为签署合约前的谈判记录，未来可选择链上加密存证。" },
  { key: "SOVEREIGN DATA", title: "数据主权在你手里", body: "所有内容托管在你可控的 Supabase 实例中，为未来迁移与自托管预留空间。" },
];

export function AdminPanel() {
  const { t } = useLocale();
  const [authState, setAuthState] = useState<"loading" | "loggedOut" | "loggedIn">("loading");
  const [networkError, setNetworkError] = useState(false);
  const [cms, setCms] = useState<Record<string, unknown>>({});
  const [logs, setLogs] = useState<{ id: string; title: string; date: string; content: string; tags: string[]; cover_image_url?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCms, setSavingCms] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGalt, setUploadingGalt] = useState(false);
  const [uploadingCamp, setUploadingCamp] = useState(false);
  const ADMIN_USERNAME_KEY = "jihe_admin_username";

  const [loginError, setLoginError] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [logForm, setLogForm] = useState<{
    id: string | null;
    title: string;
    date: string;
    content: string;
    tags: string;
    cover_image_url: string;
  }>({ id: null, title: "", date: new Date().toISOString().slice(0, 10), content: "", tags: "", cover_image_url: "" });
  const [uploadingLogCover, setUploadingLogCover] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const galtFileInputRef = useRef<HTMLInputElement>(null);
  const campFileInputRef = useRef<HTMLInputElement>(null);
  const logCoverFileInputRef = useRef<HTMLInputElement>(null);

  const AUTH_TIMEOUT_MS = 6000;
  const FALLBACK_MS = 10000; // 若一直未出结果，强制显示登录页

  const checkAuth = async (): Promise<boolean> => {
    setNetworkError(false);
    try {
      const res = await Promise.race([
        fetch(apiUrl("/api/admin/me"), { credentials: "include" }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), AUTH_TIMEOUT_MS)
        ),
      ]);
      if (res?.ok) {
        setAuthState("loggedIn");
        return true;
      }
      setAuthState("loggedOut");
      return false;
    } catch {
      setNetworkError(true);
      setAuthState("loggedOut");
      return false;
    }
  };

  const initialDoneRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      const ok = await checkAuth();
      if (initialDoneRef.current) return;
      initialDoneRef.current = true;
      if (ok) load();
      else {
        setLoading(false);
        try {
          const saved = localStorage.getItem(ADMIN_USERNAME_KEY);
          if (saved) setLoginForm((f) => ({ ...f, username: saved }));
        } catch {}
      }
    };
    run();
    const fallback = setTimeout(() => {
      if (initialDoneRef.current) return;
      initialDoneRef.current = true;
      setNetworkError(true);
      setLoading(false);
      setAuthState("loggedOut");
      try {
        const saved = localStorage.getItem(ADMIN_USERNAME_KEY);
        if (saved) setLoginForm((f) => ({ ...f, username: saved }));
      } catch {}
    }, FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, []);

  const LOAD_TIMEOUT_MS = 10000;

  const load = async () => {
    setLoading(true);
    setNetworkError(false);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LOAD_TIMEOUT_MS);
    try {
      const [cmsRes, logsRes] = await Promise.all([
        fetch(apiUrl("/api/cms"), { credentials: "include", signal: controller.signal }),
        fetch(apiUrl("/api/logs"), { credentials: "include", signal: controller.signal }),
      ]);
      clearTimeout(timeoutId);
      if (cmsRes.ok) {
        const data = await cmsRes.json();
        if (!Array.isArray(data.highlights) || data.highlights.length === 0) {
          data.highlights = DEFAULT_HIGHLIGHTS.map((h) => ({ ...h }));
        }
        setCms(data);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data);
      }
    } catch {
      clearTimeout(timeoutId);
      setNetworkError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch(apiUrl("/api/admin/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: loginForm.username, password: loginForm.password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoginError(data.error || "登录失败");
      return;
    }
    try {
      localStorage.setItem(ADMIN_USERNAME_KEY, loginForm.username);
    } catch {}
    setAuthState("loggedIn");
    load();
  };

  const handleLogout = async () => {
    await fetch(apiUrl("/api/admin/logout"), { method: "POST", credentials: "include" });
    setAuthState("loggedOut");
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(apiUrl("/api/admin/upload"), {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.hint ? `${data.error}\n\n${data.hint}` : data.error || "上传失败");
        return;
      }
      if (data.url) setCms((prev) => ({ ...prev, hero_image_url: data.url }));
    } finally {
      setUploadingHero(false);
      e.target.value = "";
    }
  };

  const handleGaltUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGalt(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(apiUrl("/api/admin/upload"), {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.hint ? `${data.error}\n\n${data.hint}` : data.error || "上传失败");
        return;
      }
      if (data.url) setCms((prev) => ({ ...prev, galt_gulch_image_url: data.url }));
    } finally {
      setUploadingGalt(false);
      e.target.value = "";
    }
  };

  const handleCampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCamp(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(apiUrl("/api/admin/upload"), {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.hint ? `${data.error}\n\n${data.hint}` : data.error || "上传失败");
        return;
      }
      if (data.url) setCms((prev) => ({ ...prev, camp_media_urls: [...(Array.isArray(prev.camp_media_urls) ? prev.camp_media_urls : []), data.url] }));
    } finally {
      setUploadingCamp(false);
      e.target.value = "";
    }
  };

  const handleLogCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogCover(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(apiUrl("/api/admin/upload"), {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.hint ? `${data.error}\n\n${data.hint}` : data.error || "上传失败");
        return;
      }
      if (data.url) setLogForm((f) => ({ ...f, cover_image_url: data.url }));
    } finally {
      setUploadingLogCover(false);
      e.target.value = "";
    }
  };

  const saveCmsAll = async () => {
    setSavingCms(true);
    try {
      const updates: Record<string, unknown> = {};
      CMS_KEYS.forEach((key) => {
        if (key === "camp_media_urls") {
          updates[key] = Array.isArray(cms[key]) ? cms[key] : [];
        } else {
          updates[key] = cms[key] ?? "";
        }
      });
      if (Array.isArray(cms.highlights) && cms.highlights.length > 0) {
        updates.highlights = cms.highlights;
      }
      const res = await fetch(apiUrl("/api/cms"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(e.hint ? `${e.error}\n\n${e.hint}` : e.error || "保存失败");
        return;
      }
      setCms((prev) => ({ ...prev, ...updates }));
    } finally {
      setSavingCms(false);
    }
  };

  const saveLog = async () => {
    const tags = logForm.tags.split(/[,，\s]+/).filter(Boolean);
    if (logForm.id) {
      const res = await fetch(apiUrl(`/api/logs/${logForm.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: logForm.title,
          content: logForm.content,
          date: logForm.date,
          tags,
          cover_image_url: logForm.cover_image_url || null,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(e.hint ? `${e.error}\n\n${e.hint}` : e.error || "更新失败");
        return;
      }
    } else {
      const res = await fetch(apiUrl("/api/logs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: logForm.title,
          content: logForm.content,
          date: logForm.date,
          tags,
          cover_image_url: logForm.cover_image_url || null,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(e.hint ? `${e.error}\n\n${e.hint}` : e.error || "创建失败");
        return;
      }
    }
    setLogForm({ id: null, title: "", date: new Date().toISOString().slice(0, 10), content: "", tags: "", cover_image_url: "" });
    load();
  };

  const deleteLog = async (id: string) => {
    if (!confirm("确定删除？")) return;
    const res = await fetch(apiUrl(`/api/logs/${id}`), {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(e.error || "删除失败");
      return;
    }
    load();
  };

  if (authState === "loading") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-foreground/60">加载中…</p>
        <p className="text-[10px] text-foreground/40">若超过 10 秒无响应，将自动显示登录页；也可直接刷新页面。</p>
      </div>
    );
  }

  if (authState === "loggedOut") {
    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-foreground/10 bg-black/40 p-6 max-w-sm">
          <h2 className="mb-1 text-sm font-semibold text-accent">{t("admin.loginTitle")}</h2>
          <p className="mb-4 text-[10px] text-foreground/50">与站点用户账号分离，仅用于管理后台。账号会本地记住。</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-foreground/70">{t("admin.username")}</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground/70">{t("admin.password")}</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                autoComplete="current-password"
              />
            </div>
            {networkError && (
              <p className="mb-2 text-xs text-amber-400">无法连接服务器，请检查网络后刷新重试。</p>
            )}
            {loginError && <p className="text-xs text-red-400">{loginError}</p>}
            <button
              type="submit"
              className="w-full rounded bg-accent px-4 py-2 text-sm font-semibold text-black"
            >
              {t("admin.loginBtn")}
            </button>
          </form>
        </section>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-foreground/60">加载中…</p>;
  }

  return (
    <div className="space-y-10">
      {networkError && (
        <p className="rounded border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          无法连接服务器，请检查网络后刷新重试。
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/70">已登录</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded border border-foreground/20 px-3 py-1.5 text-xs text-foreground/80 hover:bg-foreground/10"
        >
          {t("admin.logout")}
        </button>
      </div>

      <section className="rounded-xl border border-foreground/10 bg-black/40 p-6">
        <h2 className="mb-4 text-sm font-semibold text-accent">{t("admin.cmsTitle")}</h2>
        <div className="space-y-3">
          {CMS_KEYS.map((key) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-foreground/70">
                {CMS_LABELS[key] ?? key}
              </label>
              <div className="flex gap-2 flex-wrap items-center">
                {key !== "camp_media_urls" && (
                  <input
                    type="text"
                    value={typeof cms[key] === "string" || typeof cms[key] === "number" ? String(cms[key]) : ""}
                    onChange={(e) => setCms((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 min-w-[200px] rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
                  />
                )}
                {key === "hero_image_url" && (
                  <>
                    <input
                      ref={heroFileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleHeroUpload}
                    />
                    <button
                      type="button"
                      disabled={uploadingHero}
                      onClick={() => heroFileInputRef.current?.click()}
                      className="rounded border border-accent/60 px-3 py-2 text-xs text-accent disabled:opacity-50 whitespace-nowrap"
                    >
                      {uploadingHero ? "上传中…" : t("admin.uploadHero")}
                    </button>
                    {(cms[key] as string) ? (
                      <button
                        type="button"
                        onClick={() => setCms((prev) => ({ ...prev, [key]: "" }))}
                        className="rounded border border-red-500/60 px-3 py-2 text-xs text-red-400 whitespace-nowrap"
                      >
                        {t("admin.clearMedia")}
                      </button>
                    ) : null}
                  </>
                )}
                {key === "galt_gulch_image_url" && (
                  <>
                    <input
                      ref={galtFileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleGaltUpload}
                    />
                    <button
                      type="button"
                      disabled={uploadingGalt}
                      onClick={() => galtFileInputRef.current?.click()}
                      className="rounded border border-accent/60 px-3 py-2 text-xs text-accent disabled:opacity-50 whitespace-nowrap"
                    >
                      {uploadingGalt ? "上传中…" : t("admin.uploadHero")}
                    </button>
                    {(cms[key] as string) ? (
                      <button
                        type="button"
                        onClick={() => setCms((prev) => ({ ...prev, [key]: "" }))}
                        className="rounded border border-red-500/60 px-3 py-2 text-xs text-red-400 whitespace-nowrap"
                      >
                        {t("admin.clearMedia")}
                      </button>
                    ) : null}
                  </>
                )}
                {key === "camp_media_urls" && (
                  <>
                    <input
                      ref={campFileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleCampUpload}
                    />
                    <div className="w-full space-y-2">
                      {(Array.isArray(cms.camp_media_urls) ? cms.camp_media_urls : []).map((url, i) => (
                        <div key={i} className="flex gap-2 items-center rounded border border-foreground/20 bg-black/60 px-2 py-1.5">
                          <span className="flex-1 min-w-0 truncate text-xs text-foreground/80">{url}</span>
                          <button
                            type="button"
                            onClick={() => setCms((prev) => ({
                              ...prev,
                              camp_media_urls: (Array.isArray(prev.camp_media_urls) ? prev.camp_media_urls : []).filter((_, j) => j !== i),
                            }))}
                            className="rounded border border-red-500/60 px-2 py-1 text-xs text-red-400 shrink-0"
                          >
                            {t("admin.clearMedia")}
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2 flex-wrap items-center">
                        <button
                          type="button"
                          disabled={uploadingCamp}
                          onClick={() => campFileInputRef.current?.click()}
                          className="rounded border border-accent/60 px-3 py-2 text-xs text-accent disabled:opacity-50 whitespace-nowrap"
                        >
                          {uploadingCamp ? "上传中…" : t("admin.uploadHero")}
                        </button>
                        <span className="text-foreground/50 text-xs">或</span>
                        <input
                          type="text"
                          placeholder="粘贴图片/视频链接"
                          className="min-w-[140px] rounded border border-foreground/20 bg-black/60 px-2 py-1.5 text-xs text-foreground placeholder:text-foreground/40"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const v = (e.target as HTMLInputElement).value.trim();
                              if (v) {
                                setCms((prev) => ({ ...prev, camp_media_urls: [...(Array.isArray(prev.camp_media_urls) ? prev.camp_media_urls : []), v] }));
                                (e.target as HTMLInputElement).value = "";
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                            const v = input?.value?.trim();
                            if (v) {
                              setCms((prev) => ({ ...prev, camp_media_urls: [...(Array.isArray(prev.camp_media_urls) ? prev.camp_media_urls : []), v] }));
                              if (input) input.value = "";
                            }
                          }}
                          className="rounded border border-foreground/30 px-2 py-1.5 text-xs text-foreground/80"
                        >
                          添加链接
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-foreground/10 pt-4">
          <h3 className="mb-3 text-xs font-semibold text-accent">首页四卡片（协作 / 信用 / 交流 / 数据主权）</h3>
          {(Array.isArray(cms.highlights) ? cms.highlights : DEFAULT_HIGHLIGHTS).map((h, i) => (
            <div key={i} className="mb-4 rounded border border-foreground/20 bg-black/60 p-3 space-y-2">
              <input
                type="text"
                value={h.key}
                onChange={(e) => {
                  const next = (Array.isArray(cms.highlights) ? cms.highlights : DEFAULT_HIGHLIGHTS).map((x, j) =>
                    j === i ? { ...x, key: e.target.value } : x
                  );
                  setCms((prev) => ({ ...prev, highlights: next }));
                }}
                placeholder="key"
                className="w-full rounded border border-foreground/20 bg-black/80 px-2 py-1.5 text-xs text-foreground"
              />
              <input
                type="text"
                value={h.title}
                onChange={(e) => {
                  const next = (Array.isArray(cms.highlights) ? cms.highlights : DEFAULT_HIGHLIGHTS).map((x, j) =>
                    j === i ? { ...x, title: e.target.value } : x
                  );
                  setCms((prev) => ({ ...prev, highlights: next }));
                }}
                placeholder="标题"
                className="w-full rounded border border-foreground/20 bg-black/80 px-2 py-1.5 text-sm text-foreground"
              />
              <textarea
                value={h.body}
                onChange={(e) => {
                  const next = (Array.isArray(cms.highlights) ? cms.highlights : DEFAULT_HIGHLIGHTS).map((x, j) =>
                    j === i ? { ...x, body: e.target.value } : x
                  );
                  setCms((prev) => ({ ...prev, highlights: next }));
                }}
                placeholder="正文"
                rows={2}
                className="w-full rounded border border-foreground/20 bg-black/80 px-2 py-1.5 text-xs text-foreground"
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button
            type="button"
            disabled={savingCms}
            onClick={saveCmsAll}
            className="rounded bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {savingCms ? "保存中…" : t("admin.save")}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-foreground/10 bg-black/40 p-6">
        <h2 className="mb-4 text-sm font-semibold text-accent">{t("admin.logsTitle")}</h2>
        <div className="mb-4 grid gap-2 text-sm">
          <input
            placeholder={t("admin.logTitle")}
            value={logForm.title}
            onChange={(e) => setLogForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded border border-foreground/20 bg-black/60 px-3 py-2 text-foreground"
          />
          <input
            type="date"
            value={logForm.date}
            onChange={(e) => setLogForm((f) => ({ ...f, date: e.target.value }))}
            className="rounded border border-foreground/20 bg-black/60 px-3 py-2 text-foreground"
          />
          <textarea
            placeholder="正文"
            value={logForm.content}
            onChange={(e) => setLogForm((f) => ({ ...f, content: e.target.value }))}
            rows={4}
            className="rounded border border-foreground/20 bg-black/60 px-3 py-2 text-foreground"
          />
          <input
            placeholder={t("admin.logTags")}
            value={logForm.tags}
            onChange={(e) => setLogForm((f) => ({ ...f, tags: e.target.value }))}
            className="rounded border border-foreground/20 bg-black/60 px-3 py-2 text-foreground"
          />
          <div>
            <label className="mb-1 block text-xs text-foreground/70">{t("admin.logCover")}</label>
            <div className="flex gap-2 flex-wrap items-center">
              <input
                type="text"
                value={logForm.cover_image_url}
                onChange={(e) => setLogForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                placeholder="URL 或本地上传"
                className="flex-1 min-w-[180px] rounded border border-foreground/20 bg-black/60 px-3 py-2 text-sm text-foreground"
              />
              <input
                ref={logCoverFileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleLogCoverUpload}
              />
              <button
                type="button"
                disabled={uploadingLogCover}
                onClick={() => logCoverFileInputRef.current?.click()}
                className="rounded border border-accent/60 px-3 py-2 text-xs text-accent disabled:opacity-50 whitespace-nowrap"
              >
                {uploadingLogCover ? "上传中…" : t("admin.uploadHero")}
              </button>
              {logForm.cover_image_url ? (
                <button
                  type="button"
                  onClick={() => setLogForm((f) => ({ ...f, cover_image_url: "" }))}
                  className="rounded border border-red-500/60 px-3 py-2 text-xs text-red-400 whitespace-nowrap"
                >
                  {t("admin.clearMedia")}
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveLog}
              className="rounded bg-accent px-4 py-2 text-xs font-semibold text-black"
            >
              {logForm.id ? "更新" : "新建"}
            </button>
            {logForm.id && (
              <button
                type="button"
                onClick={() =>
                  setLogForm({
                    id: null,
                    title: "",
                    date: new Date().toISOString().slice(0, 10),
                    content: "",
                    tags: "",
                    cover_image_url: "",
                  })
                }
                className="rounded border border-foreground/20 px-4 py-2 text-xs"
              >
                {t("admin.cancelEdit")}
              </button>
            )}
          </div>
        </div>
        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between rounded border border-foreground/10 px-3 py-2 text-xs"
            >
              <span className="text-foreground">{log.title}</span>
              <span className="text-foreground/50">{log.date}</span>
              <div className="flex gap-1">
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
                  {t("admin.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => deleteLog(log.id)}
                  className="text-red-400 hover:underline"
                >
                  {t("admin.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
