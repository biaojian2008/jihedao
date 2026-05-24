"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getCurrentProfileId } from "@/lib/current-user";

type ProjectItem = {
  id: string;
  title: string;
  description: string;
  founder_name: string;
  total_assets: number;
  total_revenue: number;
  total_jihe_coins: number;
  member_count: number;
  created_at: string;
  is_member: boolean;
};

export function ProjectsListClient() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const profileId = getCurrentProfileId();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ["projects", search, profileId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const res = await fetch(`/api/projects?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "加载失败");
      return res.json() as Promise<ProjectItem[]>;
    },
  });

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-accent">项目协作</h1>
          <Link
            href="/projects/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            发起项目
          </Link>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索项目…"
            className="flex-1 rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setSearch(q.trim())}
            className="rounded-lg border border-accent/50 px-4 py-2 text-sm text-accent hover:bg-accent/10"
          >
            搜索
          </button>
        </div>

        {isLoading && <p className="text-sm text-foreground/60">加载中…</p>}
        {error && <p className="text-sm text-red-400">{(error as Error).message}</p>}

        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="block rounded-xl border border-foreground/15 bg-black/30 p-4 hover:border-accent/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-foreground">{p.title}</h2>
                  {p.is_member && (
                    <span className="shrink-0 rounded border border-accent/40 px-2 py-0.5 text-[10px] text-accent">
                      已加入
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-foreground/70">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-foreground/60">
                  <span>发起人 {p.founder_name}</span>
                  <span>成员 {p.member_count}</span>
                  <span>总资产 {p.total_assets} 济和币</span>
                  <span>总权益 {p.total_jihe_coins} 济和币</span>
                  <span>累计收益 {p.total_revenue}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {!isLoading && projects.length === 0 && (
          <p className="text-sm text-foreground/50">暂无项目，点击「发起项目」创建第一个。</p>
        )}
      </main>
    </div>
  );
}
