"use client";

import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSession } from "next-auth/react";
import { getCurrentProfileId, setCurrentProfileId } from "@/lib/current-user";
import { getFarcasterFromPrivyUser } from "@/lib/privy-farcaster";

/**
 * Privy 或 微信（NextAuth）登录成功后，同步 user_profiles 并保存 profile id
 */
export function SyncProfileOnLogin() {
  const { ready, authenticated, user } = usePrivy();
  const { data: session, status } = useSession();
  const lastSyncedKey = useRef<string | null>(null);
  const wechatSynced = useRef(false);

  useEffect(() => {
    const id = getCurrentProfileId();
    if (id) setCurrentProfileId(id);
  }, []);

  const fc = getFarcasterFromPrivyUser(user as Parameters<typeof getFarcasterFromPrivyUser>[0]);
  const farcasterFid = fc?.fid;

  const runSync = (overrideFid?: string) => {
    if (!user) return;
    const fid = overrideFid ?? fc?.fid ?? undefined;
    const display_name = fc?.display_name ?? undefined;
    const avatar_url = fc?.avatar_url ?? undefined;
    const wallet =
      (user as { wallet?: { address?: string } }).wallet?.address ??
      (user as { linkedAccounts?: { type?: string; address?: string }[] }).linkedAccounts?.find(
        (a) => a.type === "wallet"
      )?.address;
    const key = `${user.id}:${fid ?? "nofid"}`;
    lastSyncedKey.current = key;
    return fetch("/api/users/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        privy_user_id: user.id,
        wallet_address: wallet ?? undefined,
        display_name,
        avatar_url,
        fid,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) setCurrentProfileId(data.id);
        return data;
      })
      .catch(() => {
        lastSyncedKey.current = null;
      });
  };

  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    const fid = fc?.fid ?? undefined;
    const key = `${user.id}:${fid ?? "nofid"}`;
    if (lastSyncedKey.current === key) return;
    runSync();
  }, [ready, authenticated, user, fc?.fid, fc?.display_name, fc?.avatar_url]);

  // Farcaster 可能晚于首次 sync 才加载：若上次是以 nofid 同步的，延迟 1s、3s 各重试一次
  useEffect(() => {
    if (!ready || !authenticated || !user || !farcasterFid) return;
    const keyWithFid = `${user.id}:${farcasterFid}`;
    if (lastSyncedKey.current === keyWithFid) return;
    const hadNoFid = lastSyncedKey.current === `${user.id}:nofid`;
    if (!hadNoFid) return;
    const t1 = setTimeout(() => {
      if (lastSyncedKey.current === keyWithFid) return;
      runSync(farcasterFid);
    }, 1000);
    const t2 = setTimeout(() => {
      if (lastSyncedKey.current === keyWithFid) return;
      runSync(farcasterFid);
    }, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [ready, authenticated, user, farcasterFid]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.openid || wechatSynced.current) return;
    if (getCurrentProfileId()) return;
    wechatSynced.current = true;
    const u = session.user;
    fetch("/api/users/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wechat_openid: u.openid,
        display_name: u.name ?? undefined,
        avatar_url: u.image ?? undefined,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) setCurrentProfileId(data.id);
      })
      .catch(() => {
        wechatSynced.current = false;
      });
  }, [status, session?.user]);

  return null;
}
