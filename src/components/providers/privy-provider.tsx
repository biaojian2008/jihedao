"use client";

import { PrivyProvider as Privy, usePrivy } from "@privy-io/react-auth";
import { signIn, signOut, useSession } from "next-auth/react";
import { AuthProvider } from "@/lib/auth-context";
import { SyncProfileOnLogin } from "@/components/auth/sync-profile-on-login";
import { getFarcasterFromPrivyUser } from "@/lib/privy-farcaster";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

const LOGIN_NOT_CONFIGURED_MSG =
  "登录功能需要先配置 Privy。\n\n" +
  "1. 打开 https://dashboard.privy.io 创建应用，获取 App ID\n" +
  "2. 在项目 .env.local 中设置：NEXT_PUBLIC_PRIVY_APP_ID=你的AppID\n" +
  "3. 重启开发服务器 (npm run dev)";

function PrivyAuthBridge({ children }: { children: React.ReactNode }) {
  const privy = usePrivy();
  const { data: session } = useSession();
  const byWechat = !privy.authenticated && !!session?.user?.openid;
  const fc = getFarcasterFromPrivyUser(privy.user as Parameters<typeof getFarcasterFromPrivyUser>[0]);
  const value = {
    ready: true,
    authenticated: privy.authenticated || !!session,
    authSource: (byWechat ? "wechat" : "privy") as "wechat" | "privy",
    login: privy.login,
    loginWithWechat: () => signIn("wechat", { callbackUrl: "/" }),
    logout: byWechat
      ? () => signOut({ callbackUrl: "/" })
      : privy.logout,
    user: privy.user
      ? {
          id: privy.user.id,
          fid: fc?.fid,
          display_name: fc?.display_name,
          avatar_url: fc?.avatar_url,
        }
      : session?.user?.openid
        ? { id: session.user.openid }
        : null,
  };
  return (
    <AuthProvider value={value}>
      <SyncProfileOnLogin />
      {children}
    </AuthProvider>
  );
}

function WechatOnlyAuth({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const value = {
    ready: true,
    authenticated: !!session,
    authSource: (session?.user?.openid ? "wechat" : undefined) as "wechat" | undefined,
    login: () => window.alert(LOGIN_NOT_CONFIGURED_MSG),
    loginWithWechat: () => signIn("wechat", { callbackUrl: "/" }),
    logout: () => signOut({ callbackUrl: "/" }),
    user: session?.user?.openid ? { id: session.user.openid } : null,
  };
  return (
    <AuthProvider value={value}>
      <SyncProfileOnLogin />
      {children}
    </AuthProvider>
  );
}

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  if (!appId) {
    return (
      <WechatOnlyAuth>
        {children}
      </WechatOnlyAuth>
    );
  }
  return (
    <Privy
      appId={appId}
      config={{
        // 不含 sms：Privy SMS 在部分地区（如中国）不可用，会报 "This region is not supported"
        loginMethods: ["email", "wallet", "farcaster"],
        appearance: {
          theme: "dark",
          accentColor: "#00ff00",
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "all-users" },
        },
      }}
    >
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </Privy>
  );
}
