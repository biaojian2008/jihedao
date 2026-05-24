"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentProfileId } from "@/lib/current-user";
import { isShareholder, roleLabel } from "@/lib/projects/roles";
import type { ProjectRole } from "@/lib/projects/types";

type ProjectDetail = {
  id: string;
  title: string;
  description: string;
  rules_text: string;
  total_assets: number;
  total_revenue: number;
  total_jihe_coins: number;
  member_count: number;
  founder_name: string;
  my_membership: {
    role: ProjectRole;
    investment_coins: number;
    contribution_coins: number;
    status: string;
  } | null;
};

type Pool = {
  id: string;
  year_month: string;
  pool_amount: number;
  status: string;
  review_round: number;
  appeal_deadline: string | null;
};

export function ProjectDetailClient({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const profileId = getCurrentProfileId();
  const [investAmount, setInvestAmount] = useState("");
  const [poolMonth, setPoolMonth] = useState("");
  const [poolAmount, setPoolAmount] = useState("");
  const [rulesDraft, setRulesDraft] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId, profileId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("加载失败");
      return res.json() as Promise<ProjectDetail>;
    },
  });

  const { data: pools = [] } = useQuery({
    queryKey: ["project-pools", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/pools`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json() as Promise<Pool[]>;
    },
  });

  const { data: motionsData } = useQuery({
    queryKey: ["project-motions", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/motions`, { credentials: "include" });
      if (!res.ok) return { motions: [], votes: [] };
      return res.json() as Promise<{
        motions: { id: string; motion_type: string; status: string }[];
        votes: { motion_id: string; voter_id: string; approved: boolean }[];
      }>;
    },
  });

  const membership = project?.my_membership;
  const isMember = membership?.status === "active";
  const isSh = membership ? isShareholder(membership.role) : false;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project-pools", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project-motions", projectId] });
  };

  const invest = async () => {
    setErr("");
    setMsg("");
    const res = await fetch(`/api/projects/${projectId}/invest`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(investAmount) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "投资失败");
      return;
    }
    setMsg("投资已记录");
    setInvestAmount("");
    refresh();
  };

  const proposePool = async () => {
    setErr("");
    const res = await fetch(`/api/projects/${projectId}/pools`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year_month: poolMonth, pool_amount: Number(poolAmount) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "发起失败");
      return;
    }
    setMsg("贡献池议案已发起，请全体股东投票");
    refresh();
  };

  const proposeRules = async () => {
    setErr("");
    const res = await fetch(`/api/projects/${projectId}/motions`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motion_type: "rules_change", payload: { rules_text: rulesDraft } }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "发起失败");
      return;
    }
    setMsg("规则修改议案已发起");
    refresh();
  };

  const voteMotion = async (motionId: string, approved: boolean) => {
    setErr("");
    const res = await fetch(`/api/projects/${projectId}/motions/${motionId}/vote`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "投票失败");
      return;
    }
    setMsg(approved ? "已同意议案" : "已反对议案");
    refresh();
  };

  const exitProject = async () => {
    if (!confirm("确定退出项目？将按资产比例结算，不保证 1:1 兑现。")) return;
    setErr("");
    const res = await fetch(`/api/projects/${projectId}/exit`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "退出失败");
      return;
    }
    setMsg(`已退出，结算 ${data.payout ?? 0} 济和币`);
    refresh();
  };

  if (isLoading || !project) {
    return <div className="min-h-screen pt-14 pb-20 px-4 py-8 text-sm text-foreground/60">加载中…</div>;
  }

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/projects" className="text-xs text-accent/80 hover:text-accent">
          ← 项目列表
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-accent">{project.title}</h1>
        <p className="mt-1 text-xs text-foreground/60">发起人 {project.founder_name}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["总资产", project.total_assets],
              ["总济和币", project.total_jihe_coins],
              ["累计收益", project.total_revenue],
              ["成员", project.member_count],
            ] as const
          ).map(([label, val]) => (
            <div key={label} className="rounded-lg border border-foreground/15 bg-black/30 p-3">
              <p className="text-[10px] text-foreground/50">{label}</p>
              <p className="text-sm font-medium text-accent">{val}</p>
            </div>
          ))}
        </div>

        {membership && isMember && (
          <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs">
            我的角色：{roleLabel(membership.role)} · 投资币 {membership.investment_coins} · 贡献币{" "}
            {membership.contribution_coins}
          </div>
        )}

        <nav className="mt-6 flex flex-wrap gap-2 text-xs">
          <Link href={`/projects/${projectId}/members`} className="rounded border border-foreground/20 px-3 py-1.5 hover:border-accent/40 hover:text-accent">
            成员
          </Link>
          <Link href={`/projects/${projectId}/dividend`} className="rounded border border-foreground/20 px-3 py-1.5 hover:border-accent/40 hover:text-accent">
            分红
          </Link>
        </nav>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-foreground/80">项目介绍</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{project.description}</p>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-medium text-foreground/80">项目规则</h2>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-foreground/15 bg-black/30 p-3 text-xs">{project.rules_text}</pre>
        </section>

        {isMember && (
          <section className="mt-6 rounded-xl border border-foreground/15 bg-black/20 p-4">
            <h2 className="text-sm font-medium text-accent">投资录入</h2>
            <div className="mt-3 flex gap-2">
              <input type="number" min="1" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} placeholder="金额（元）" className="flex-1 rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm" />
              <button type="button" onClick={invest} className="rounded bg-accent px-4 py-2 text-sm font-semibold text-black">确认投资</button>
            </div>
          </section>
        )}

        {isSh && (
          <section className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-4">
            <h2 className="text-sm font-medium text-accent">股东操作</h2>
            <div className="flex flex-wrap gap-2">
              <input value={poolMonth} onChange={(e) => setPoolMonth(e.target.value)} placeholder="YYYY-MM" className="rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm" />
              <input type="number" min="0" value={poolAmount} onChange={(e) => setPoolAmount(e.target.value)} placeholder="贡献池济和币" className="rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm" />
              <button type="button" onClick={proposePool} className="rounded border border-accent/50 px-3 py-2 text-sm text-accent">发起贡献池议案</button>
            </div>
            <textarea value={rulesDraft} onChange={(e) => setRulesDraft(e.target.value)} rows={3} className="w-full rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm" />
            <button type="button" onClick={proposeRules} className="rounded border border-accent/50 px-3 py-2 text-sm text-accent">发起规则修改</button>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-medium text-foreground/80">月度贡献池</h2>
          <ul className="mt-2 space-y-2">
            {pools.map((pool) => (
              <li key={pool.id} className="rounded-lg border border-foreground/15 bg-black/30 p-3 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{pool.year_month}</span>
                  <span className="text-foreground/60">{pool.pool_amount} 济和币 · {pool.status}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  {pool.status === "collecting" && isMember && (
                    <Link href={`/projects/${projectId}/contribute/${pool.id}`} className="text-accent hover:underline">贡献申报</Link>
                  )}
                  {(pool.status === "reviewing" || (pool.status === "appeal" && pool.review_round === 2)) && isMember && (
                    <Link href={`/projects/${projectId}/review/${pool.id}`} className="text-accent hover:underline">盲评</Link>
                  )}
                  {pool.status === "appeal" && isMember && (
                    <Link href={`/projects/${projectId}/appeal/${pool.id}`} className="text-accent hover:underline">申诉</Link>
                  )}
                  {isSh && pool.status === "collecting" && (
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/projects/${projectId}/pools/${pool.id}`, {
                          method: "POST",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "start_review" }),
                        });
                        refresh();
                      }}
                      className="text-accent hover:underline"
                    >
                      开启盲评
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {(motionsData?.motions ?? []).some((m) => m.status === "pending") && (
          <section className="mt-6">
            <h2 className="text-sm font-medium text-foreground/80">待表决议案</h2>
            <ul className="mt-2 space-y-2">
              {(motionsData?.motions ?? [])
                .filter((m) => m.status === "pending")
                .map((m) => (
                  <li key={m.id} className="rounded-lg border border-foreground/15 bg-black/30 p-3 text-xs">
                    <p>{m.motion_type === "pool_amount" ? "贡献池设定" : "规则修改"}</p>
                    {isSh && profileId && !(motionsData?.votes ?? []).some((v) => v.motion_id === m.id && v.voter_id === profileId) && (
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => voteMotion(m.id, true)} className="rounded bg-accent px-2 py-1 text-black">同意</button>
                        <button type="button" onClick={() => voteMotion(m.id, false)} className="rounded border border-red-500/50 px-2 py-1 text-red-400">反对</button>
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        )}

        {isMember && membership?.role !== "founder" && (
          <button type="button" onClick={exitProject} className="mt-8 rounded border border-red-500/50 px-4 py-2 text-sm text-red-400">退出项目</button>
        )}

        {msg && <p className="mt-4 text-xs text-accent">{msg}</p>}
        {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
      </main>
    </div>
  );
}
