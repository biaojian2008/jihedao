"use client";

import { useEffect, useState } from "react";

type Guideline = {
  id: string;
  cancer_type: string;
  subtype: string | null;
  stage: string | null;
  source: string | null;
  source_url: string | null;
  standard_treatment: string | null;
  china_availability: string | null;
  india_availability: string | null;
  verified: boolean;
  has_embedding: boolean;
};

type Hospital = {
  id: string;
  name: string;
  city: string | null;
  jci_accredited: boolean;
  specialties: string[] | null;
  cost_range: Record<string, unknown> | null;
  reputation_score: number | null;
  intl_patient_contact: string | null;
  source_url: string | null;
  verified: boolean;
};

const fetchOpts = { credentials: "include" as const };

const emptyForm = {
  name: "",
  city: "",
  jci_accredited: false,
  specialties: "",
  intl_patient_contact: "",
  source_url: "",
  reputation_score: "",
  cost_note: "",
};

export function AdminCancerSection() {
  const [tab, setTab] = useState<"guidelines" | "hospitals">("guidelines");
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadGuidelines() {
    setLoading(true);
    try {
      const res = await fetch("/api/canmou/cancer/admin/guidelines", fetchOpts);
      const data = (await res.json()) as { items?: Guideline[] };
      setGuidelines(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function loadHospitals() {
    setLoading(true);
    try {
      const res = await fetch("/api/canmou/cancer/admin/hospitals", fetchOpts);
      const data = (await res.json()) as { items?: Hospital[] };
      setHospitals(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "guidelines") loadGuidelines();
    if (tab === "hospitals") loadHospitals();
  }, [tab]);

  async function toggleGuideline(id: string, verified: boolean) {
    await fetch("/api/canmou/cancer/admin/guidelines", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, verified }),
    });
    setGuidelines((prev) => prev.map((g) => (g.id === id ? { ...g, verified } : g)));
  }

  async function toggleHospital(id: string, verified: boolean) {
    await fetch("/api/canmou/cancer/admin/hospitals", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, verified }),
    });
    setHospitals((prev) => prev.map((h) => (h.id === id ? { ...h, verified } : h)));
  }

  async function deleteHospital(id: string) {
    if (!confirm("确认删除该医院？")) return;
    await fetch(`/api/canmou/cancer/admin/hospitals?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setHospitals((prev) => prev.filter((h) => h.id !== id));
  }

  async function addHospital() {
    if (!form.name.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/canmou/cancer/admin/hospitals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          city: form.city,
          jci_accredited: form.jci_accredited,
          specialties: form.specialties.split(/[、,，]/).map((s) => s.trim()).filter(Boolean),
          intl_patient_contact: form.intl_patient_contact,
          source_url: form.source_url,
          reputation_score: form.reputation_score ? Number(form.reputation_score) : null,
          cost_range: form.cost_note ? { note: form.cost_note } : {},
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setMsg("✅ 已新增（待核实）");
        setForm({ ...emptyForm });
        loadHospitals();
      } else {
        setMsg(`❌ ${data.error}`);
      }
    } catch (e) {
      setMsg(`❌ ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  const verifiedCount = guidelines.filter((g) => g.verified).length;

  return (
    <section className="mt-10 border-t border-foreground/10 pt-8">
      <h2 className="mb-1 text-lg font-semibold">🏥 癌症国际就医</h2>
      <p className="mb-4 text-xs text-foreground/50">
        指南人工签发、印度医院录入与核实。未核实内容不会对患者展示。
      </p>

      <div className="mb-6 flex gap-2">
        {(
          [
            ["guidelines", `指南核实 (${verifiedCount}/${guidelines.length})`],
            ["hospitals", "医院管理"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
              tab === key
                ? "border-foreground/40 bg-foreground/10 text-foreground"
                : "border-foreground/10 text-foreground/50 hover:border-foreground/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-xs text-foreground/40">加载中…</p>}

      {/* 指南核实 */}
      {tab === "guidelines" && !loading && (
        <div className="space-y-3">
          {guidelines.length === 0 && <p className="text-xs text-foreground/40">暂无指南</p>}
          {guidelines.map((g) => (
            <div key={g.id} className="rounded-xl border border-foreground/10 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {g.cancer_type}
                    {g.subtype ? ` · ${g.subtype}` : ""}
                    {g.stage ? ` · ${g.stage}` : ""}
                  </p>
                  <p className="mt-0.5 text-[10px] text-foreground/40">
                    {g.source}
                    {g.source_url ? (
                      <>
                        {" · "}
                        <a
                          href={g.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          原文 ↗
                        </a>
                      </>
                    ) : null}
                    {" · "}
                    {g.has_embedding ? "已向量化" : "无向量"}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                      g.verified
                        ? "border-green-500/40 bg-green-500/10 text-green-400"
                        : "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {g.verified ? "已签发" : "待核实"}
                  </span>
                  <button
                    onClick={() => toggleGuideline(g.id, !g.verified)}
                    className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                      g.verified
                        ? "border-foreground/20 text-foreground/60 hover:bg-foreground/5"
                        : "border-green-500/30 bg-green-500/15 text-green-400 hover:bg-green-500/25"
                    }`}
                  >
                    {g.verified ? "撤销" : "签发"}
                  </button>
                </div>
              </div>
              {g.standard_treatment ? (
                <p className="mt-2 text-xs leading-relaxed text-foreground/60">
                  {g.standard_treatment}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* 医院管理 */}
      {tab === "hospitals" && !loading && (
        <div className="space-y-5">
          {/* 录入表单 */}
          <div className="rounded-xl border border-foreground/10 p-4">
            <p className="mb-3 text-xs font-medium text-foreground/70">新增医院（录入后需核实才展示）</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="医院名称 *"
                className="col-span-2 rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm"
              />
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="城市"
                className="rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm"
              />
              <input
                value={form.reputation_score}
                onChange={(e) => setForm({ ...form, reputation_score: e.target.value })}
                placeholder="口碑评分 0–10"
                inputMode="decimal"
                className="rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm"
              />
              <input
                value={form.specialties}
                onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                placeholder="擅长癌种（顿号或逗号分隔）"
                className="col-span-2 rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm"
              />
              <input
                value={form.intl_patient_contact}
                onChange={(e) => setForm({ ...form, intl_patient_contact: e.target.value })}
                placeholder="国际患者部联系方式"
                className="col-span-2 rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm"
              />
              <input
                value={form.source_url}
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                placeholder="信源/官网 URL"
                className="col-span-2 rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm"
              />
              <input
                value={form.cost_note}
                onChange={(e) => setForm({ ...form, cost_note: e.target.value })}
                placeholder="费用区间备注"
                className="col-span-2 rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm"
              />
              <label className="col-span-2 flex items-center gap-2 text-xs text-foreground/70">
                <input
                  type="checkbox"
                  checked={form.jci_accredited}
                  onChange={(e) => setForm({ ...form, jci_accredited: e.target.checked })}
                  className="accent-accent"
                />
                JCI 认证
              </label>
            </div>
            <button
              onClick={addHospital}
              disabled={saving || !form.name.trim()}
              className="mt-3 rounded-lg bg-foreground px-4 py-2 text-sm text-background transition hover:opacity-80 disabled:opacity-40"
            >
              {saving ? "保存中…" : "新增"}
            </button>
            {msg && <p className="mt-2 text-xs text-foreground/60">{msg}</p>}
          </div>

          {/* 医院列表 */}
          <div className="space-y-2">
            {hospitals.length === 0 && <p className="text-xs text-foreground/40">暂无医院</p>}
            {hospitals.map((h) => (
              <div key={h.id} className="rounded-xl border border-foreground/10 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {h.name}
                      {h.jci_accredited ? (
                        <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">
                          JCI
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[10px] text-foreground/40">
                      {[h.city, Array.isArray(h.specialties) ? h.specialties.join("、") : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] ${
                        h.verified
                          ? "border-green-500/40 bg-green-500/10 text-green-400"
                          : "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {h.verified ? "已核实" : "待核实"}
                    </span>
                    <button
                      onClick={() => toggleHospital(h.id, !h.verified)}
                      className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                        h.verified
                          ? "border-foreground/20 text-foreground/60 hover:bg-foreground/5"
                          : "border-green-500/30 bg-green-500/15 text-green-400 hover:bg-green-500/25"
                      }`}
                    >
                      {h.verified ? "撤销" : "核实通过"}
                    </button>
                    <button
                      onClick={() => deleteHospital(h.id)}
                      className="text-xs text-red-400/60 transition hover:text-red-400"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
