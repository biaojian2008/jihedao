"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDisplayDid, getDisplayNameOrDid } from "@/lib/did";
import { getCurrentProfileId } from "@/lib/current-user";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  IconUserPlusOutline,
  IconUserCheckFilled,
  IconBlock,
} from "@/components/layout/nav-icons";

type Member = {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  fid: string | null;
  custom_did: string | null;
  credit_score: number;
  jihe_coin_balance: number;
  badges: { name: string; description: string | null; icon_url: string | null }[];
};

type Props = {
  member: Member;
  lastMessage?: string;
  isBlockedTab?: boolean;
  onUnblock?: () => void;
};

export function MemberCard({ member, lastMessage, isBlockedTab, onUnblock }: Props) {
  const { t } = useLocale();
  const currentId = getCurrentProfileId();
  const isOwn = currentId === member.id;
  const displayDid = getDisplayDid(member.fid, member.custom_did);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    if (!currentId) return;
    fetch(`/api/follows?userId=${currentId}`)
      .then((r) => (r.ok ? r.json() : { following: [] }))
      .then((data) => setFollowing((data.following ?? []).includes(member.id)));
  }, [currentId, member.id]);

  const toggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentId || isOwn || loading) return;
    setLoading(true);
    try {
      if (following) {
        await fetch("/api/follows", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ follower_id: currentId, following_id: member.id }),
        });
        setFollowing(false);
      } else {
        await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ follower_id: currentId, following_id: member.id }),
        });
        setFollowing(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const [blockError, setBlockError] = useState<string | null>(null);

  const toggleBlock = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentId || isOwn || blocking) return;
    setBlockError(null);
    setBlocking(true);
    try {
      if (isBlockedTab) {
        const res = await fetch("/api/blocks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: currentId, blocked_user_id: member.id }),
        });
        if (res.ok) {
          onUnblock?.();
        } else {
          const data = await res.json().catch(() => ({}));
          setBlockError((data as { error?: string })?.error || "取消失败");
        }
      } else {
        const res = await fetch("/api/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: currentId, blocked_user_id: member.id }),
        });
        if (res.ok) {
          onUnblock?.();
        } else {
          const data = await res.json().catch(() => ({}));
          setBlockError((data as { error?: string })?.error || "屏蔽失败");
        }
      }
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="rounded-xl border border-foreground/10 bg-black/40 p-4">
      <div className="flex items-start gap-3">
        <Link href={`/u/${member.id}`} className="shrink-0" title="个人名片">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-foreground/20" />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/dm?with=${member.id}`} className="min-w-0 flex-1">
              <span className="font-medium text-foreground hover:text-accent">
                {getDisplayNameOrDid(member)}
              </span>
              {displayDid && (
                <p className="mt-0.5 font-mono text-[10px] text-foreground/60 break-all">{displayDid}</p>
              )}
            </Link>
            {lastMessage ? (
              <Link
                href={`/dm?with=${member.id}`}
                className="shrink-0 max-w-[45%] truncate text-[11px] text-foreground/60 hover:text-accent"
                title={lastMessage}
              >
                {lastMessage}
              </Link>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-foreground/70">
            <span>{t("profile.credit")} {member.credit_score}</span>
            <span>·</span>
            <span>{member.jihe_coin_balance} 济和币</span>
          </div>
          {member.badges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {member.badges.map((b) => (
                <span
                  key={b.name}
                  className="rounded border border-foreground/20 px-1.5 py-0.5 text-[10px] text-foreground/80"
                  title={b.description ?? undefined}
                >
                  {b.name}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!isOwn && (
              <>
                <button
                  type="button"
                  onClick={toggleFollow}
                  disabled={loading}
                  className="rounded-full p-2 text-foreground/60 hover:bg-foreground/10 hover:text-accent disabled:opacity-50"
                  title={following ? "取消关注" : "关注"}
                  aria-label={following ? "取消关注" : "关注"}
                >
                  {following ? (
                    <IconUserCheckFilled className="h-5 w-5 text-accent" />
                  ) : (
                    <IconUserPlusOutline className="h-5 w-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={toggleBlock}
                  disabled={blocking}
                  className={`rounded-full p-2 disabled:opacity-50 ${
                    isBlockedTab
                      ? "text-amber-500 hover:bg-amber-500/20"
                      : "text-foreground/60 hover:bg-foreground/10 hover:text-amber-500"
                  }`}
                  title={isBlockedTab ? t("members.unblock") : t("members.block")}
                  aria-label={isBlockedTab ? t("members.unblock") : t("members.block")}
                >
                  <IconBlock className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
        {isBlockedTab && (
          <span className="shrink-0 self-start rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">
            已屏蔽
          </span>
        )}
      </div>
      {blockError && (
        <p className="mt-2 text-xs text-red-400">{blockError}</p>
      )}
    </div>
  );
}
