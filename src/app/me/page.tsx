/**
 * 当前用户：有 profile id 则进 /u/[id]；已登录但无 profile 则先同步再进个人页；同步失败则提示并允许重试
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentProfileId, setCurrentProfileId } from "@/lib/current-user";
import { useAuth } from "@/lib/auth-context";

export default function MePage() {
  const router = useRouter();
  const { ready, authenticated, user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const doSync = useCallback(() => {
    if (!user?.id) return;
    setSyncError(null);
    setSyncing(true);
    fetch("/api/users/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        privy_user_id: user.id,
        ...(user.fid != null && user.fid !== "" && { fid: user.fid }),
        ...(user.display_name != null && { display_name: user.display_name }),
        ...(user.avatar_url != null && { avatar_url: user.avatar_url }),
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e?.error || r.statusText));
        return r.json();
      })
      .then((data: { id?: string }) => {
        if (data?.id) {
          setCurrentProfileId(data.id);
          router.replace(`/u/${data.id}`);
        } else {
          setSyncError("同步返回异常，请重试");
        }
      })
      .catch((err) => {
        const msg =
          err?.message === "Failed to fetch"
            ? "网络请求失败，请检查网络或后端是否正常。若为本地开发，请确认 .env 中 Supabase 配置正确且已执行 supabase/schema.sql 建表。"
            : typeof err === "string"
              ? err
              : err?.message || "同步失败，请确认 Supabase 已执行 supabase/schema.sql 建表";
        setSyncError(msg);
      })
      .finally(() => setSyncing(false));
  }, [user?.id, router]);

  useEffect(() => {
    const id = getCurrentProfileId();
    if (id) {
      router.replace(`/u/${id}`);
      return;
    }
    if (!ready) return;
    if (!authenticated || !user?.id) {
      router.replace("/dm");
      return;
    }
    doSync();
  }, [ready, authenticated, user?.id, router, doSync]);

  if (syncError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-foreground/80">{syncError}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={doSync}
            disabled={syncing}
            className="rounded-full border border-accent bg-accent/10 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent hover:text-black disabled:opacity-50"
          >
            {syncing ? "同步中…" : "重试"}
          </button>
          <Link
            href="/dm"
            className="rounded-full border border-foreground/30 px-4 py-2 text-xs font-semibold text-foreground/80 hover:text-accent"
          >
            去交流
          </Link>
        </div>
      </div>
    );
  }

  return (
    <p className="flex min-h-screen items-center justify-center text-sm text-foreground/60">
      {syncing ? "正在同步资料…" : "跳转中…"}
    </p>
  );
}