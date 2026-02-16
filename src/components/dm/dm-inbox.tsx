"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentProfileId, setCurrentProfileId } from "@/lib/current-user";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/i18n/locale-context";

type Conversation = {
  id: string;
  last_message_preview: string | null;
  updated_at: string;
  other_user_id: string;
  other_display_name: string;
};

export function DmInbox() {
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");
  const { t } = useLocale();
  const { ready, authenticated, user, authSource } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [profileId, setProfileIdState] = useState<string | null>(getCurrentProfileId());
  const createAttemptedFor = useRef<string | null>(null);
  const router = useRouter();

  const refreshProfileId = () => setProfileIdState(getCurrentProfileId());

  useEffect(() => {
    refreshProfileId();
  }, []);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    fetch(`/api/conversations?userId=${profileId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setConversations)
      .finally(() => setLoading(false));
  }, [profileId]);

  useEffect(() => {
    const key = withUserId && profileId ? `${profileId}:${withUserId}` : null;
    if (!key || createAttemptedFor.current === key) return;
    createAttemptedFor.current = key;
    setCreating(true);
    fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: profileId,
        other_user_id: withUserId,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          router.replace(`/dm/${data.id}`);
          return;
        }
        setCreating(false);
        createAttemptedFor.current = null;
      })
      .catch(() => {
        setCreating(false);
        createAttemptedFor.current = null;
      });
  }, [withUserId, profileId, router]);

  if (!profileId) {
    if (ready && authenticated && user?.id) {
      return (
        <div className="space-y-3 rounded-xl border border-foreground/10 bg-black/40 p-4">
          <p className="text-sm text-foreground/70">{t("profile.dmNeedDid")}</p>
          <Link
            href="/me"
            className="inline-block rounded-full border border-accent bg-accent/10 px-4 py-2 text-center text-xs font-semibold text-accent hover:bg-accent hover:text-black"
          >
            前往个人中心
          </Link>
          <button
            type="button"
            disabled={syncing}
            onClick={() => {
              setSyncing(true);
              const body =
                authSource === "wechat"
                  ? { wechat_openid: user.id }
                  : { privy_user_id: user.id };
              fetch("/api/users/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              })
                .then((r) => (r.ok ? r.json() : null))
                .then((data: { id?: string }) => {
                  if (data?.id) {
                    setCurrentProfileId(data.id);
                    refreshProfileId();
                  }
                })
                .finally(() => setSyncing(false));
            }}
            className="rounded-full border border-accent bg-accent/10 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent hover:text-black disabled:opacity-50"
          >
            {syncing ? "同步中…" : "同步资料"}
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-2 rounded-xl border border-foreground/10 bg-black/40 p-4">
        <p className="text-sm text-foreground/70">{t("dm.needLogin")}</p>
        <p className="text-[11px] text-foreground/50">交流需先登录并同步 DID（个人中心）。</p>
      </div>
    );
  }

  if (withUserId && creating) {
    return <p className="text-sm text-foreground/60">{t("dm.openConversation")}</p>;
  }

  if (loading) {
    return <p className="text-sm text-foreground/60">{t("common.loading")}</p>;
  }

  if (conversations.length === 0 && !withUserId) {
    return <p className="text-sm text-foreground/60">{t("dm.empty")}</p>;
  }

  return (
    <ul className="space-y-2">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`/dm/${c.id}`}
            className="block rounded-xl border border-foreground/10 bg-black/40 p-4 transition hover:border-accent/40"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                {c.other_display_name}
              </span>
              <span className="text-[10px] text-foreground/50">
                {new Date(c.updated_at).toLocaleDateString("zh-CN")}
              </span>
            </div>
            {c.last_message_preview && (
              <p className="mt-1 truncate text-xs text-foreground/60">
                {c.last_message_preview}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
