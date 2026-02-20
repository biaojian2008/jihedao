"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/lib/i18n/locale-context";
import { getCurrentProfileId } from "@/lib/current-user";

type Group = {
  id: string;
  name: string;
  created_by: string;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  member_count: number;
};

export function GroupsList() {
  const { t } = useLocale();
  const profileId = getCurrentProfileId();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups", profileId],
    queryFn: async () => {
      const res = await fetch("/api/groups", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Group[]>;
    },
    enabled: !!profileId,
  });

  const handleCreate = async () => {
    const name = createName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreateOpen(false);
        setCreateName("");
        queryClient.invalidateQueries({ queryKey: ["groups", profileId] });
        if (data?.id) window.location.href = `/groups/${data.id}`;
      } else {
        alert(data?.error ?? "创建失败");
      }
    } finally {
      setCreating(false);
    }
  };

  if (!profileId) {
    return (
      <p className="text-sm text-foreground/60">{t("dm.needLogin")}</p>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-foreground/60">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/70">{t("members.groupsDesc")}</span>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded border border-accent bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent hover:text-black"
        >
          {t("groups.create")}
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground/50">{t("groups.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/groups/${g.id}`}
                className="block rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 transition hover:border-accent/30"
              >
                <h3 className="font-medium text-foreground">{g.name}</h3>
                <p className="mt-1 text-xs text-foreground/60">
                  {g.member_count} 人
                  {g.last_message_preview && ` · ${g.last_message_preview}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setCreateOpen(false)}>
          <div className="w-full max-w-sm rounded-xl border border-foreground/20 bg-background p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-sm font-semibold">{t("groups.create")}</h3>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={t("groups.groupName")}
              className="mb-3 w-full rounded border border-foreground/30 bg-background px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="rounded border px-3 py-1.5 text-xs">
                {t("publisher.cancel")}
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!createName.trim() || creating}
                className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
              >
                {creating ? "…" : t("groups.create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
