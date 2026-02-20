"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useLocale } from "@/lib/i18n/locale-context";
import { getDisplayDid, getDisplayNameOrDid, getSystemDid } from "@/lib/did";
import { getCurrentProfileId, setCurrentProfileId } from "@/lib/current-user";
import { getFarcasterFromPrivyUser } from "@/lib/privy-farcaster";
import { useAuth } from "@/lib/auth-context";
import { TransferModal } from "@/components/transfer/transfer-modal";
import { TipPopover } from "@/components/ui/tip-popover";
import { IconCamera } from "@/components/layout/nav-icons";

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

export function ProfileCard({ profile, userId }: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const privy = usePrivy();
  const { logout } = useAuth();
  const isOwnProfile = getCurrentProfileId() === userId;
  const displayDid = getDisplayDid(profile.fid, profile.custom_did) || getSystemDid(userId);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [syncingFarcaster, setSyncingFarcaster] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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
  const farcasterFields = privyUser ? getFarcasterFromPrivyUser(privyUser as Parameters<typeof getFarcasterFromPrivyUser>[0]) : null;
  const canSyncFarcaster = isOwnProfile && !!privyUser?.id;
  const didAutoSyncFarcaster = useRef(false);

  useEffect(() => {
    setAvatarUrl(profile.avatar_url ?? "");
  }, [profile.avatar_url]);

  // 本人且档案无 fid 但 Privy 有 Farcaster：自动同步一次，以便显示 DID 与头像/昵称
  useEffect(() => {
    if (!isOwnProfile || profile.fid || !farcasterFields?.fid || !privyUser?.id || didAutoSyncFarcaster.current)
      return;
    didAutoSyncFarcaster.current = true;
    setSyncError(null);
    const wallet =
      (privyUser as { wallet?: { address?: string } }).wallet?.address ??
      (privyUser as { linkedAccounts?: { type?: string; address?: string }[] }).linkedAccounts?.find(
        (a) => a.type === "wallet"
      )?.address;
    fetch("/api/users/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        privy_user_id: privyUser.id,
        wallet_address: wallet ?? undefined,
        display_name: farcasterFields.display_name,
        avatar_url: farcasterFields.avatar_url,
        fid: farcasterFields.fid,
      }),
    })
      .then(async (r) => {
        if (r.ok) return r.json();
        const data = await r.json().catch(() => ({}));
        setSyncError([data?.error, data?.hint].filter(Boolean).join(" ") || `HTTP ${r.status}`);
        didAutoSyncFarcaster.current = false;
        return null;
      })
      .then((data) => {
        if (data?.id) router.refresh();
      })
      .catch(() => {
        setSyncError("网络请求失败");
        didAutoSyncFarcaster.current = false;
      });
  }, [isOwnProfile, profile.fid, farcasterFields?.fid, farcasterFields?.display_name, farcasterFields?.avatar_url, privyUser, router]);

  const creditLabel =
    profile.credit_score >= 80
      ? t("profile.creditHigh")
      : profile.credit_score >= 50
        ? t("profile.creditMid")
        : t("profile.creditNew");

  const handleSyncFarcaster = async () => {
    if (!isOwnProfile || !privyUser?.id) return;
    setSyncError(null);
    setSyncingFarcaster(true);
    try {
      const fc = getFarcasterFromPrivyUser(privyUser as Parameters<typeof getFarcasterFromPrivyUser>[0]);
      const wallet =
        (privyUser as { wallet?: { address?: string } }).wallet?.address ??
        (privyUser as { linkedAccounts?: { type?: string; address?: string }[] }).linkedAccounts?.find(
          (a) => a.type === "wallet"
        )?.address;
      const res = await fetch("/api/users/sync", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privy_user_id: privyUser.id,
          wallet_address: wallet ?? undefined,
          display_name: fc?.display_name,
          avatar_url: fc?.avatar_url,
          fid: fc?.fid,
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.id) setCurrentProfileId(data.id);
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setSyncError([data?.error, data?.hint].filter(Boolean).join(" ") || `HTTP ${res.status}`);
    } catch {
      setSyncError("网络请求失败");
    } finally {
      setSyncingFarcaster(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;
    const prevPreview = avatarPreview;
    const blobUrl = URL.createObjectURL(file);
    setAvatarPreview(blobUrl);
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
        const msg = err?.error ?? "Upload failed";
        if (uploadRes.status === 401) {
          alert("无法识别您的身份（未登录或未同步档案）。请从底部「个人中心」进入并登录后再试。\n\n" + msg);
        } else {
          alert(msg);
        }
        return;
      }
      const data = await uploadRes.json();
      const url = data?.url;
      if (!url) {
        alert("上传成功但未返回图片地址");
        return;
      }
      if (prevPreview) URL.revokeObjectURL(prevPreview);
      setAvatarPreview(null);
      setAvatarUrl(url);
      const patchRes = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatar_url: url }),
      });
      if (patchRes.ok) {
        router.refresh();
      } else {
        const err = await patchRes.json().catch(() => ({}));
        alert(err?.error ?? "头像已上传，但保存到档案失败，请刷新后重试");
      }
    } catch (err) {
      alert("网络错误或上传失败，请重试");
    } finally {
      setUploadingAvatar(false);
      setAvatarPreview(null);
      URL.revokeObjectURL(blobUrl);
      e.target.value = "";
    }
  };

  const displayAvatarUrl = avatarPreview || avatarUrl || profile.avatar_url;

  return (
    <div className="rounded-xl border border-foreground/10 bg-black/40 p-6">
      {syncError && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <p className="font-medium">同步失败</p>
          <p className="mt-1 break-words">{syncError}</p>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {displayAvatarUrl ? (
            /* key 避免缓存导致新头像不更新 */
            <img
              key={displayAvatarUrl}
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
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-black shadow"
                aria-label={t("profile.uploadAvatar")}
              >
                <IconCamera className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-foreground font-mono">
            {displayDid || getDisplayNameOrDid(profile)}
          </h1>
          {profile.bio && (
            <p className="mt-1 text-sm text-foreground/70">{profile.bio}</p>
          )}
        </div>
      </div>

      <dl className="mt-6 grid gap-2 text-xs">
        <div>
          <dt className="text-foreground/50">
            <TipPopover
              title="DID"
              content={
                <>
                  <p>去中心化身份标识，是您在平台内的唯一身份凭证。</p>
                  <p className="mt-2">格式：did:jihe:@用户名 或 Farcaster FID。一旦保存不可修改。</p>
                </>
              }
            >
              <span className="cursor-pointer hover:text-accent">{t("profile.did")} ℹ️</span>
            </TipPopover>
          </dt>
          <dd>
            <span className="font-mono text-foreground break-all">{displayDid}</span>
          </dd>
        </div>
        {profile.wallet_address ? (
          <div>
            <dt className="text-foreground/50">
              <TipPopover
                title="钱包"
                content="您登录时绑定的链上钱包地址，用于 SBT 签发、转账等操作。非济和 DAO 专属，为通用链上身份。"
              >
                <span className="cursor-pointer hover:text-accent">{t("profile.wallet")} ℹ️</span>
              </TipPopover>
            </dt>
            <dd className="font-mono text-foreground/90 break-all">
              {profile.wallet_address}
            </dd>
            <p className="mt-0.5 text-[11px] text-foreground/50">{t("profile.walletHint")}</p>
          </div>
        ) : isOwnProfile ? (
          <div>
            <dt className="text-foreground/50">{t("profile.wallet")}</dt>
            <dd className="text-[11px] text-foreground/50">{t("profile.walletHint")}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-foreground/50">
            <TipPopover title="信誉分" content={<><p>基于协作行为计算的信用评分，影响项目参与、任务接取等。</p><p className="mt-2">来源：完成任务、获得好评、持续参与等。高分用户享有更多协作机会。</p></>}>
              <span className="cursor-pointer hover:text-accent">{t("profile.credit")} ℹ️</span>
            </TipPopover>
          </dt>
          <dd className="font-semibold text-accent">
            {profile.credit_score} · {creditLabel}
          </dd>
        </div>
        <div>
          <dt className="text-foreground/50">
            <TipPopover title="济和币" content={<><p>平台内积分，用于参与项目、任务、课程等。</p><p className="mt-2">获得方式：发帖 +5、评论 +2、被点赞 +1、完成任务 +10、获得勋章 +20。可用于抵押、冻结、转账。</p></>}>
              <span className="cursor-pointer hover:text-accent">{t("profile.jiheCoin")} ℹ️</span>
            </TipPopover>
          </dt>
          <dd className="font-semibold text-accent">
            {profile.jihe_coin_balance} 济和币
          </dd>
        </div>
      </dl>

      {profile.badges?.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-xs uppercase tracking-wider text-accent/80">
            <TipPopover title="SBT 勋章" content=" Soulbound Token，链上不可转移凭证。获得勋章可提升信誉，部分勋章由社区或项目方签发。">
              <span className="cursor-pointer hover:text-accent">{t("profile.badges")} ℹ️</span>
            </TipPopover>
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

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {isOwnProfile && privyUser?.id && !farcasterFields?.fid && (
          <div className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-foreground/90">
            <p className="font-medium text-amber-600/90">{t("profile.syncFarcasterNeedFarcaster")}</p>
            <a href="https://warpcast.com" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-accent hover:underline">
              Warpcast（Farcaster 客户端）
            </a>
          </div>
        )}
        {canSyncFarcaster && farcasterFields?.fid && (
          <>
            <button
              type="button"
              onClick={handleSyncFarcaster}
              disabled={syncingFarcaster}
              className="rounded-full border border-foreground/30 bg-foreground/5 px-4 py-2 text-xs font-semibold text-foreground hover:bg-foreground/10 disabled:opacity-50"
            >
              {syncingFarcaster ? "同步中…" : "从 Farcaster 同步身份与头像"}
            </button>
            {syncError && (
              <p className="w-full text-xs text-red-400 mt-1 break-words">
                {syncError}
              </p>
            )}
          </>
        )}
        {isOwnProfile && (
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-full border border-foreground/20 px-4 py-2 text-xs text-foreground/70 hover:text-foreground hover:border-foreground/40"
          >
            登出
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
          toUserName={getDisplayNameOrDid(profile)}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </div>
  );
}
