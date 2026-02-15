"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

type AuthUser = { id: string; fid?: string; display_name?: string; avatar_url?: string } | null;

type AuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  /** "wechat" 时 sync 用 wechat_openid，否则用 privy_user_id */
  authSource?: "privy" | "wechat";
  login: () => void;
  loginWithWechat?: () => void;
  logout: () => void;
  user: AuthUser;
};

const defaultAuth: AuthContextValue = {
  ready: true,
  authenticated: false,
  login: () => {},
  logout: () => {},
  user: null,
};

const AuthContext = createContext<AuthContextValue>(defaultAuth);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({
  value,
  children,
}: {
  value?: AuthContextValue;
  children: ReactNode;
}) {
  const v = useMemo(() => value ?? defaultAuth, [value]);
  return (
    <AuthContext.Provider value={v}>
      {children}
    </AuthContext.Provider>
  );
}
