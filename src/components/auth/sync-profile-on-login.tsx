"use client";

import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSession } from "next-auth/react";
import { getCurrentProfileId, setCurrentProfileId } from "@/lib/current-user";

/**
 * Privy 或 微信（NextAuth）登录成功后，同步 user_profiles 并保存 profile id
 */
export function SyncProfileOnLogin() {
  const { ready, authenticated, user } = usePrivy();
  const { data: session, status } = useSession();
  const privySynced = useRef(false);
  const lastSyncedKey = useRef<string | null>(null);
  const wechatSynced = useRef(false);

  useEffect(() => {
    const id = getCurrentProfileId();
    if (id) setCurrentProfileId(id);
  }, []);

  const u = user as {
    farcaster?: { fid?: number | null; displayName?: string | null; pfp?: string | null };
    linkedAccounts?: Array<{ type?: string; fid?: number; displayName?: string | null; pfp?: string | null }>;
    name?: string;
    avatar?: string;
    wallet?: { address?: string };
  } | null;
  const farcasterFid = u?.farcaster?.fid ?? u?.linkedAccounts?.find((a) => a.type === "farcaster")?.fid;

  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    const usr = user as {
      farcaster?: { fid?: number | null; displayName?: string | null; pfp?: string | null };
      linkedAccounts?: Array<{ type?: string; fid?: number; displayName?: string | null; pfp?: string | null }>;
      name?: string;
      avatar?: string;
      wallet?: { address?: string };
    };
    const fc = usr.farcaster ?? usr.linkedAccounts?.find((a) => a.type === "farcaster");
    const fid = fc?.fid != null ? String(fc.fid) : undefined;
    const display_name = usr.name ?? fc?.displayName ?? undefined;
    const avatar_url = usr.avatar ?? fc?.pfp ?? undefined;
    const wallet =
      (user as { wallet?: { address?: string } }).wallet?.address ??
      (user as { linkedAccounts?: { type?: string; address?: string }[] }).linkedAccounts?.find(
        (a) => a.type === "wallet"
      )?.address;
    const key = `${user.id}:${fid ?? "nofid"}`;
    if (lastSyncedKey.current === key) return;
    lastSyncedKey.current = key;
    fetch("/api/users/sync", {
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
        if (data?.id) {
          setCurrentProfileId(data.id);
          privySynced.current = true;
        }
      })
      .catch(() => {
        lastSyncedKey.current = null;
      });
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
