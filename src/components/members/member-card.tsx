"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDisplayDid } from "@/lib/did";
import { getCurrentProfileId } from "@/lib/current-user";
import { useLocale } from "@/lib/i18n/locale-context";
import { TransferModal } from "@/components/transfer/transfer-modal";
import { IconTransfer } from "@/components/layout/nav-icons";

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

type Props = { member: Member };

export function MemberCard({ member }: Props) {
  const { t } = useLocale();
  const currentId = getCurrentProfileId();
  const isOwn = currentId === member.id;
  const displayDid = getDisplayDid(member.fid, member.custom_did);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    if (!currentId) return;
    fetch(`/api/follows?userId=${currentId}`)
      .then((r) => (r.ok ? r.json() : { following: [] }))
      .then((data) => setFollowing((data.following ?? []).includes(member.id)));
  }, [currentId, member.id]);

  const toggleFollow = async () => {
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

  return (
    <div className="rounded-xl border border-foreground/10 bg-black/40 p-4">
      <div className="flex items-start gap-3">
        <Link href={`/u/${member.id}`} className="shrink-0">
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
          <Link href={`/u/${member.id}`} className="font-medium text-foreground hover:text-accent">
            {member.display_name ?? "匿名"}
          </Link>
          {displayDid && (
            <p className="mt-0.5 font-mono text-[10px] text-foreground/60 break-all">{displayDid}</p>
          )}
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
          <div className="mt-3 flex flex-wrap gap-2">
            {!isOwn && (
              <>
                <Link
                  href={`/dm?with=${member.id}`}
                  className="rounded-full border border-accent px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent hover:text-black"
                >
                  {t("profile.dm")}
                </Link>
                <button
                  type="button"
                  onClick={() => setShowTransfer(true)}
                  className="rounded-full border border-foreground/30 bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-foreground/10 inline-flex items-center gap-1"
                  title={t("profile.transfer")}
                >
                  <IconTransfer className="h-3.5 w-3.5" />
                  {t("profile.transfer")}
                </button>
                <button
                  type="button"
                  onClick={toggleFollow}
                  disabled={loading}
                  className="rounded-full border border-foreground/30 bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-foreground/10 disabled:opacity-50"
                >
                  {loading ? "…" : following ? "已关注" : "关注"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {showTransfer && (
        <TransferModal
          toUserId={member.id}
          toUserName={member.display_name ?? "匿名"}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </div>
  );
}
