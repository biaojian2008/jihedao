"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2 } from "lucide-react";

type Props = { userId: string };

export function ReadwiseTokenSettings({ userId }: Props) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setError(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/readwise/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ readwise_token: token.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccessMsg("已绑定");
        setToken("");
        queryClient.invalidateQueries({ queryKey: ["readwise-highlights", userId] });
      } else {
        setError((data as { error?: string }).error || (data as { hint?: string }).hint || "保存失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-foreground/10 bg-black/40 p-4">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent/80">
        <KeyRound className="h-4 w-4" />
        个人情报接入 · Readwise
      </h2>
      <p className="mt-2 text-xs text-foreground/60">
        默认使用网站配置的情报源；绑定个人 Token 可展示你自己的阅读标注。Token 仅存于服务端，不会泄露。
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="password"
          placeholder="个人 Readwise Token（可选）"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm font-mono text-foreground placeholder:text-foreground/40 focus:border-accent/60 focus:outline-none"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={saving || !token.trim()}
          className="flex items-center justify-center gap-2 rounded-lg border border-accent/60 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent hover:text-black disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          绑定个人
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setError(null);
            setSuccessMsg(null);
            setSaving(true);
            try {
              const res = await fetch("/api/readwise/token", { method: "DELETE", credentials: "include" });
              if (res.ok) {
                setSuccessMsg("已清除，恢复使用网站默认");
                queryClient.invalidateQueries({ queryKey: ["readwise-highlights", userId] });
              }
            } catch {
              setError("网络错误");
            } finally {
              setSaving(false);
            }
          }}
          className="rounded-lg border border-foreground/30 px-4 py-2 text-xs font-medium text-foreground/70 hover:bg-foreground/10 disabled:opacity-50"
        >
          清除个人
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {successMsg && <p className="mt-2 text-xs text-accent">{successMsg}</p>}
    </div>
  );
}
