"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { useLocale } from "@/lib/i18n/locale-context";
import { TranslateButton } from "@/components/translate-button";
import { getDisplayDid } from "@/lib/did";
import { getCurrentProfileId } from "@/lib/current-user";
import { TransferModal } from "@/components/transfer/transfer-modal";

type Profile = {
  display_name: string | null;
  bio: string | null;
  wallet_address: string | null;
  fid: string | null;
  custom_did: string | null;
  avatar_url: string | null;
  credit_score: number;
  jihe_coin_balance: number;
  badges: { name: string; description: string | null; icon_url: string | null }[];
};

type Props = { profile: Profile; userId: string };

function SavedPostsSection({ userId }: { userId: string }) {
  const { t } = useLocale();
  const { data: saved = [] } = useQuery({
    queryKey: ["saved-posts", userId],
    queryFn: async () => {
      const res = await fetch(`/api/saved-posts?userId=${userId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });
  if (saved.length === 0) return null;
  return (
    <div className="mt-6">
      <h2 className="text-xs uppercase tracking-wider text-accent/80">收藏的帖子</h2>
      <ul className="mt-2 space-y-2">
        {saved.map((item: { id: string; title: string; author_name: string }) => (
          <li key={item.id}>
            <Link
              href={`/community/${item.id}`}
              className="block rounded-lg border border-foreground/10 bg-black/40 px-3 py-2 text-sm text-foreground hover:border-accent/40"
            >
              <span className="font-medium">{item.title}</span>
              <span className="ml-2 text-xs text-foreground/60">{item.author_name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProfileCard({ profile, userId }: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const privy = usePrivy();
  const isOwnProfile = getCurrentProfileId() === userId;
  const displayDid = getDisplayDid(profile.fid, profile.custom_did);

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [customDidInput, setCustomDidInput] = useState(profile.custom_did ?? "");
  const [didError, setDidError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingDid, setSavingDid] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [syncingFarcaster, setSyncingFarcaster] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const privyUser = privy.authenticated ? (privy.user as {
    id: string;
    farcaster?: { fid?: number | null; displayName?: string | null; pfp?: string | null };
    linkedAccounts?: Array<{ type?: string; fid?: number; displayName?: string | null; pfp?: string | null }>;
    name?: string;
    avatar?: string;
    wallet?: { address?: string };
  }) : null;
  const farcaster = privyUser?.farcaster ?? privyUser?.linkedAccounts?.find((a) => a.type === "farcaster");
  const canSyncFarcaster = isOwnProfile && !!privyUser?.id && !!farcaster;

  useEffect(() => {
    setDisplayName(profile.display_name ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
    setCustomDidInput(profile.custom_did ?? "");
  }, [profile.display_name, profile.avatar_url, profile.custom_did]);

  const creditLabel =
    profile.credit_score >= 80
      ? t("profile.creditHigh")
      : profile.credit_score >= 50
        ? t("profile.creditMid")
        : t("profile.creditNew");

  const handleSaveProfile = async () => {
    if (!isOwnProfile) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ display_name: displayName || null }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDid = async () => {
    if (!isOwnProfile || profile.fid) return;
    setDidError(null);
    setSavingDid(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ custom_did: customDidInput.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setDidError(t("profile.didTaken"));
        return;
      }
      if (!res.ok) {
        setDidError(data?.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setSavingDid(false);
    }
  };

  const handleSyncFarcaster = async () => {
    if (!canSyncFarcaster || !privyUser) return;
    setSyncingFarcaster(true);
    try {
      const fid = farcaster?.fid != null ? String(farcaster.fid) : undefined;
      const display_name = privyUser.name ?? farcaster?.displayName ?? undefined;
      const avatar_url = privyUser.avatar ?? farcaster?.pfp ?? undefined;
      const wallet =
        privyUser.wallet?.address ??
        (privyUser as { linkedAccounts?: { type?: string; address?: string }[] }).linkedAccounts?.find(
          (a) => a.type === "wallet"
        )?.address;
      const res = await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privy_user_id: privyUser.id,
          wallet_address: wallet ?? undefined,
          display_name,
          avatar_url,
          fid,
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSyncingFarcaster(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/users/avatar", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        alert(err?.error ?? "Upload failed");
        return;
      }
      const { url } = await uploadRes.json();
      const patchRes = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatar_url: url }),
      });
      if (patchRes.ok) {
        setAvatarUrl(url);
        router.refresh();
      }
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const displayAvatarUrl = avatarUrl || profile.avatar_url;

  return (
    <div className="rounded-xl border border-foreground/10 bg-black/40 p-6">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {displayAvatarUrl ? (
            <img
              src={displayAvatarUrl}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-foreground/20" />
          )}
          {isOwnProfile && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 rounded-full bg-accent px-2 py-1 text-[10px] font-medium text-black"
              >
                {uploadingAvatar ? "…" : t("profile.uploadAvatar")}
              </button>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {isOwnProfile ? (
            <div>
              <label className="block text-xs text-foreground/50">{t("profile.nickname")}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={handleSaveProfile}
                placeholder={t("profile.nickname")}
                className="mt-0.5 w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-xl font-semibold text-foreground placeholder:text-foreground/40"
              />
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="mt-2 text-xs text-accent hover:underline disabled:opacity-50"
              >
                {saving ? "…" : t("profile.save")}
              </button>
            </div>
          ) : (
            <h1 className="text-xl font-semibold text-foreground">
              {profile.display_name ?? "匿名"}
            </h1>
          )}
          {profile.bio && (
            <p className="mt-1 text-sm text-foreground/70">{profile.bio}</p>
          )}
        </div>
      </div>

      <dl className="mt-6 grid gap-2 text-xs">
        <div>
          <dt className="text-foreground/50">{t("profile.did")}</dt>
          <dd>
            {profile.fid ? (
              <span className="font-mono text-foreground break-all">{displayDid}</span>
            ) : isOwnProfile ? (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-foreground/70">did:jihe:</span>
                  <input
                    type="text"
                    value={customDidInput}
                    onChange={(e) => {
                      setCustomDidInput(e.target.value);
                      setDidError(null);
                    }}
                    placeholder={t("profile.didPlaceholder")}
                    className="min-w-[120px] flex-1 rounded border border-foreground/20 bg-black/40 px-2 py-1 font-mono text-foreground placeholder:text-foreground/40"
                  />
                  <button
                    type="button"
                    onClick={handleSaveDid}
                    disabled={savingDid}
                    className="rounded border border-accent/60 px-2 py-1 text-accent"
                  >
                    {savingDid ? "…" : t("profile.save")}
                  </button>
                </div>
                {didError && (
                  <p className="mt-1 text-red-400">{didError}</p>
                )}
              </div>
            ) : (
              <span className="font-mono text-foreground break-all">
                {displayDid || t("profile.didNotSet")}
              </span>
            )}
          </dd>
        </div>
        {profile.wallet_address && (
          <div>
            <dt className="text-foreground/50">{t("profile.wallet")}</dt>
            <dd className="font-mono text-foreground/90 break-all">
              {profile.wallet_address}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-foreground/50">{t("profile.credit")}</dt>
          <dd className="font-semibold text-accent">
            {profile.credit_score} · {creditLabel}
          </dd>
        </div>
        <div>
          <dt className="text-foreground/50">{t("profile.jiheCoin")}</dt>
          <dd className="font-semibold text-accent">
            {profile.jihe_coin_balance} 济和币
          </dd>
        </div>
      </dl>

      {profile.badges?.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-xs uppercase tracking-wider text-accent/80">
            {t("profile.badges")}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {profile.badges.map((b) => (
              <li
                key={b.name}
                className="rounded-lg border border-foreground/20 px-3 py-2 text-xs"
              >
                <span className="font-medium text-foreground">{b.name}</span>
                {b.description && (
                  <p className="mt-0.5 text-foreground/60">{b.description}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isOwnProfile && (
        <SavedPostsSection userId={userId} />
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {canSyncFarcaster && (
          <button
            type="button"
            onClick={handleSyncFarcaster}
            disabled={syncingFarcaster}
            className="rounded-full border border-foreground/30 bg-foreground/5 px-4 py-2 text-xs font-semibold text-foreground hover:bg-foreground/10 disabled:opacity-50"
          >
            {syncingFarcaster ? "同步中…" : "从 Farcaster 同步头像与昵称"}
          </button>
        )}
        {!isOwnProfile && (
          <>
            <Link
              href={`/dm?with=${userId}`}
              className="inline-block rounded-full border border-accent px-4 py-2 text-xs font-semibold text-accent hover:bg-accent hover:text-black"
            >
              {t("profile.dm")}
            </Link>
            <button
              type="button"
              onClick={() => setShowTransfer(true)}
              className="rounded-full border border-foreground/30 bg-foreground/5 px-4 py-2 text-xs font-semibold text-foreground hover:bg-foreground/10"
            >
              {t("profile.transfer")}
            </button>
          </>
        )}
      </div>
      {showTransfer && !isOwnProfile && (
        <TransferModal
          toUserId={userId}
          toUserName={profile.display_name ?? "匿名"}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </div>
  );
}
