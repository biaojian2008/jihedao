/**
 * 个人中心入口：有 profile 则跳 /u/[id]；否则尝试同步或显示说明，不阻塞导航
 * Farcaster 的 fid/头像/昵称可能晚于首次 sync 才加载，会在 fid 到位后补同步一次
 */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentProfileId, setCurrentProfileId } from "@/lib/current-user";
import { useAuth } from "@/lib/auth-context";

const SYNC_FETCH_TIMEOUT_MS = 12000;

type Status = "idle" | "redirecting" | "syncing" | "done" | "error" | "no-auth" | "no-profile";

export default function MePage() {
  const router = useRouter();
  const { ready, authenticated, user } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const started = useRef(false);

  const doSync = useCallback(
    (payload?: { fid?: string; display_name?: string; avatar_url?: string }) => {
      if (!user?.id) return;
      const fid = payload?.fid ?? (user.fid != null && user.fid !== "" ? user.fid : undefined);
      const display_name = payload?.display_name ?? user.display_name ?? undefined;
      const avatar_url = payload?.avatar_url ?? user.avatar_url ?? undefined;
      setSyncError(null);
      setStatus("syncing");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SYNC_FETCH_TIMEOUT_MS);
      fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privy_user_id: user.id,
          ...(fid != null && fid !== "" && { fid }),
          ...(display_name != null && { display_name }),
          ...(avatar_url != null && { avatar_url }),
        }),
        signal: controller.signal,
      })
        .then((r) => {
          clearTimeout(timeoutId);
          if (!r.ok) return r.json().then((e: { error?: string }) => Promise.reject(e?.error || r.statusText));
          return r.json();
        })
        .then((data: { id?: string }) => {
          if (data?.id) {
            setCurrentProfileId(data.id);
            setStatus("redirecting");
            router.replace(`/u/${data.id}`);
          } else {
            setSyncError("同步返回异常，请重试");
            setStatus("error");
          }
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          const isAbort = err?.name === "AbortError";
          setSyncError(isAbort ? "同步超时，请检查网络后重试" : (err?.message || err) || "同步失败，请重试");
          setStatus("error");
        });
    },
    [user?.id, user?.fid, user?.display_name, user?.avatar_url, router]
  );

  useEffect(() => {
    if (started.current) return;
    if (!ready) return;

    const id = getCurrentProfileId();
    if (id) {
      started.current = true;
      setStatus("redirecting");
      router.replace(`/u/${id}`);
      return;
    }

    if (!authenticated) {
      started.current = true;
      setStatus("no-auth");
      return;
    }

    if (!user?.id) {
      started.current = true;
      setStatus("no-profile");
      return;
    }

    started.current = true;
    doSync();
  }, [ready, authenticated, user?.id, router, doSync]);


  const links = (
    <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
      <Link
        href="/"
        className="rounded-full border border-foreground/30 px-4 py-2 text-foreground/80 hover:border-accent/50 hover:text-accent"
      >
        返回首页
      </Link>
      <Link
        href="/community"
        className="rounded-full border border-foreground/30 px-4 py-2 text-foreground/80 hover:border-accent/50 hover:text-accent"
      >
        社区
      </Link>
      <Link
        href="/dm"
        className="rounded-full border border-accent/50 px-4 py-2 text-accent hover:bg-accent/10"
      >
        去交流
      </Link>
    </div>
  );

  if (status === "no-auth") {
    return (
      <div className="min-h-screen pt-14 pb-20 md:pb-16">
        <main className="mx-auto max-w-xl px-4 py-8 text-center sm:px-6">
          <h1 className="mb-2 text-xl font-semibold text-foreground">个人中心</h1>
          <p className="text-sm text-foreground/70">请先登录</p>
          {links}
        </main>
      </div>
    );
  }

  if (status === "no-profile") {
    return (
      <div className="min-h-screen pt-14 pb-20 md:pb-16">
        <main className="mx-auto max-w-xl px-4 py-8 text-center sm:px-6">
          <h1 className="mb-2 text-xl font-semibold text-foreground">个人中心</h1>
          <p className="text-sm text-foreground/70">
            您已登录。个人档案需使用 Farcaster / 邮箱 / 钱包 登录后同步；Google 登录暂不支持个人档案。
          </p>
          {links}
        </main>
      </div>
    );
  }

  if (status === "error" && syncError) {
    return (
      <div className="min-h-screen pt-14 pb-20 md:pb-16">
        <main className="mx-auto max-w-xl px-4 py-8 text-center sm:px-6">
          <h1 className="mb-2 text-xl font-semibold text-foreground">个人中心</h1>
          <p className="text-sm text-foreground/80">{syncError}</p>
          <div className="mt-3">
            <button
              type="button"
              onClick={doSync}
              className="rounded-full border border-accent bg-accent/10 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent hover:text-black"
            >
              重试同步
            </button>
          </div>
          {links}
        </main>
      </div>
    );
  }

  if (status === "redirecting" || status === "syncing") {
    return (
      <div className="min-h-screen pt-14 pb-20 md:pb-16">
        <main className="mx-auto max-w-xl px-4 py-8 text-center sm:px-6">
          <h1 className="mb-2 text-xl font-semibold text-foreground">个人中心</h1>
          <p className="text-sm text-foreground/60">
            {status === "syncing" ? "正在同步资料…" : "正在跳转…"}
          </p>
          {links}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-8 text-center sm:px-6">
        <h1 className="mb-2 text-xl font-semibold text-foreground">个人中心</h1>
        <p className="text-sm text-foreground/60">加载中…</p>
        {links}
      </main>
    </div>
  );
}
