"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { roleLabel } from "@/lib/projects/roles";
import type { ProjectRole } from "@/lib/projects/types";

export function ProjectMembersClient({ projectId }: { projectId: string }) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/members`, { credentials: "include" });
      if (!res.ok) throw new Error("加载失败");
      return res.json() as Promise<
        {
          user_id: string;
          display_name: string;
          role: ProjectRole;
          investment_coins: number;
          contribution_coins: number;
          total_coins: number;
          status: string;
        }[]
      >;
    },
  });

  return (
    <div className="min-h-screen pt-14 pb-20 px-4 py-8">
      <Link href={`/projects/${projectId}`} className="text-xs text-accent">← 返回项目</Link>
      <h1 className="mt-4 text-xl font-semibold text-accent">项目成员</h1>
      {isLoading && <p className="mt-4 text-sm text-foreground/60">加载中…</p>}
      <ul className="mt-4 space-y-2">
        {members.map((m) => (
          <li key={m.user_id} className="rounded-lg border border-foreground/15 bg-black/30 p-3 text-sm">
            <div className="flex justify-between gap-2">
              <Link href={`/u/${m.user_id}`} className="font-medium hover:text-accent">{m.display_name}</Link>
              <span className="text-xs text-foreground/60">{roleLabel(m.role)} · {m.status}</span>
            </div>
            <p className="mt-1 text-xs text-foreground/70">
              投资 {m.investment_coins} · 贡献 {m.contribution_coins} · 合计 {m.total_coins} 济和币
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectContributeClient({ projectId, poolId }: { projectId: string; poolId: string }) {
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    const res = await fetch(`/api/projects/${projectId}/pools/${poolId}/submit`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "提交失败");
      return;
    }
    setMsg("贡献说明已提交");
  };

  return (
    <div className="min-h-screen pt-14 pb-20 px-4 py-8 max-w-xl mx-auto">
      <Link href={`/projects/${projectId}`} className="text-xs text-accent">← 返回项目</Link>
      <h1 className="mt-4 text-xl font-semibold text-accent">月度贡献申报</h1>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} className="mt-4 w-full rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm" placeholder="描述本月贡献…" />
      <button type="button" onClick={submit} className="mt-3 rounded bg-accent px-4 py-2 text-sm font-semibold text-black">提交</button>
      {msg && <p className="mt-2 text-xs text-accent">{msg}</p>}
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </div>
  );
}

export function ProjectReviewClient({ projectId, poolId }: { projectId: string; poolId: string }) {
  const [targets, setTargets] = useState<{ target_id: string; points: string; name: string }[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useQuery({
    queryKey: ["review-pool", projectId, poolId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/pools/${poolId}`, { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      const subs = (data.submissions ?? []) as { user_id: string; description: string }[];
      const memRes = await fetch(`/api/projects/${projectId}/members`, { credentials: "include" });
      const members = memRes.ok ? ((await memRes.json()) as { user_id: string; display_name: string }[]) : [];
      const nameMap = Object.fromEntries(members.map((m) => [m.user_id, m.display_name]));
      setTargets(subs.map((s) => ({ target_id: s.user_id, points: "", name: nameMap[s.user_id] ?? s.user_id.slice(0, 8) })));
      return data;
    },
  });

  const total = targets.reduce((s, t) => s + (Number(t.points) || 0), 0);

  const submit = async () => {
    setErr("");
    const res = await fetch(`/api/projects/${projectId}/pools/${poolId}/review`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        votes: targets.filter((t) => Number(t.points) > 0).map((t) => ({ target_id: t.target_id, points: Number(t.points) })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "提交失败");
      return;
    }
    setMsg("盲评已提交");
  };

  return (
    <div className="min-h-screen pt-14 pb-20 px-4 py-8 max-w-xl mx-auto">
      <Link href={`/projects/${projectId}`} className="text-xs text-accent">← 返回项目</Link>
      <h1 className="mt-4 text-xl font-semibold text-accent">盲评投票</h1>
      <p className="mt-1 text-xs text-foreground/60">共 100 贡献点，单人 1–50 点，不能给自己投票，须全部投完。</p>
      <ul className="mt-4 space-y-3">
        {targets.map((t, i) => (
          <li key={t.target_id} className="flex items-center justify-between gap-2 text-sm">
            <span>{t.name}</span>
            <input type="number" min="1" max="50" value={t.points} onChange={(e) => {
              const next = [...targets];
              next[i] = { ...t, points: e.target.value };
              setTargets(next);
            }} className="w-20 rounded border border-foreground/20 bg-black/40 px-2 py-1 text-sm" />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-foreground/60">已分配 {total} / 100 点</p>
      <button type="button" onClick={submit} className="mt-3 rounded bg-accent px-4 py-2 text-sm font-semibold text-black">提交盲评</button>
      {msg && <p className="mt-2 text-xs text-accent">{msg}</p>}
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </div>
  );
}

export function ProjectAppealClient({ projectId, poolId }: { projectId: string; poolId: string }) {
  const [reason, setReason] = useState("");
  const [coSigners, setCoSigners] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async () => {
    setErr("");
    const ids = coSigners.split(/[\s,]+/).filter(Boolean);
    const res = await fetch(`/api/projects/${projectId}/pools/${poolId}/appeal`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, co_signer_ids: ids }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "申诉失败");
      return;
    }
    setMsg("申诉已受理，进入第二轮盲评");
  };

  const finalize = async () => {
    const res = await fetch(`/api/projects/${projectId}/pools/${poolId}/appeal`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "finalize" }),
    });
    const data = await res.json();
    if (!res.ok) setErr(data.error ?? "操作失败");
    else setMsg("申诉期已结束，结果生效");
  };

  return (
    <div className="min-h-screen pt-14 pb-20 px-4 py-8 max-w-xl mx-auto">
      <Link href={`/projects/${projectId}`} className="text-xs text-accent">← 返回项目</Link>
      <h1 className="mt-4 text-xl font-semibold text-accent">申诉</h1>
      <p className="mt-1 text-xs text-foreground/60">投票结束后 48 小时内，至少 3 人联署，只能申诉一次。</p>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-4 w-full rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm" placeholder="申诉理由" />
      <input value={coSigners} onChange={(e) => setCoSigners(e.target.value)} placeholder="联署人 user_id，空格分隔（至少 2 人）" className="mt-2 w-full rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm" />
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={submit} className="rounded bg-accent px-4 py-2 text-sm font-semibold text-black">发起申诉</button>
        <button type="button" onClick={finalize} className="rounded border border-foreground/30 px-4 py-2 text-sm">确认申诉期结束</button>
      </div>
      {msg && <p className="mt-2 text-xs text-accent">{msg}</p>}
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </div>
  );
}

export function ProjectDividendClient({ projectId }: { projectId: string }) {
  const [revenue, setRevenue] = useState("");
  const [dividend, setDividend] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const { data } = useQuery({
    queryKey: ["project-dividends", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/dividends`, { credentials: "include" });
      if (!res.ok) return { periods: [], distributions: [] };
      return res.json();
    },
  });

  const addRevenue = async () => {
    const r = await fetch(`/api/projects/${projectId}/dividends`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_revenue", revenue_amount: Number(revenue) }),
    });
    const d = await r.json();
    if (!r.ok) setErr(d.error ?? "失败");
    else setMsg(`累计收益已更新为 ${d.total_revenue}`);
  };

  const distribute = async () => {
    const res = await fetch(`/api/projects/${projectId}/dividends`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total_amount: Number(dividend) }),
    });
    const d = await res.json();
    if (!res.ok) setErr(d.error ?? "分红失败");
    else setMsg("分红已完成");
  };

  return (
    <div className="min-h-screen pt-14 pb-20 px-4 py-8 max-w-xl mx-auto">
      <Link href={`/projects/${projectId}`} className="text-xs text-accent">← 返回项目</Link>
      <h1 className="mt-4 text-xl font-semibold text-accent">分红</h1>
      <p className="mt-1 text-xs text-foreground/60">按成员总济和币（投资+贡献）占比分配。</p>
      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="录入项目收益" className="flex-1 rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm" />
          <button type="button" onClick={addRevenue} className="rounded border border-accent/50 px-3 py-2 text-sm text-accent">录入</button>
        </div>
        <div className="flex gap-2">
          <input type="number" value={dividend} onChange={(e) => setDividend(e.target.value)} placeholder="本次分红总额" className="flex-1 rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm" />
          <button type="button" onClick={distribute} className="rounded bg-accent px-3 py-2 text-sm font-semibold text-black">执行分红</button>
        </div>
      </div>
      <ul className="mt-6 space-y-2 text-xs">
        {((data?.periods as { id: string; total_amount: number; status: string; created_at: string }[]) ?? []).map((p) => (
          <li key={p.id} className="rounded border border-foreground/15 p-2">{p.created_at.slice(0, 10)} · {p.total_amount} 济和币 · {p.status}</li>
        ))}
      </ul>
      {msg && <p className="mt-2 text-xs text-accent">{msg}</p>}
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </div>
  );
}
