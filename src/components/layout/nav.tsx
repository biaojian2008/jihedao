"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/messages";
import { NavIcon } from "./nav-icons";

const navKeys = [
  { href: "/", key: "nav.home" },
  { href: "/log", key: "nav.log" },
  { href: "/community", key: "nav.community" },
  { href: "/members", key: "nav.members" },
  { href: "/dm", key: "nav.dm" },
  { href: "/intel", key: "nav.intel" },
  { href: "/admin", key: "nav.admin" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const { ready, authenticated, login, logout } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const [loginOpen, setLoginOpen] = useState(false);

  const handlePrivyLogin = () => {
    setLoginOpen(false);
    login();
  };

  const handleGoogleLogin = () => {
    setLoginOpen(false);
    const base = typeof window !== "undefined" ? window.location.origin : "";
    window.location.href = `${base}/api/auth/signin/google?callbackUrl=${encodeURIComponent(base + "/")}`;
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-foreground/10 bg-background/95 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold uppercase tracking-wider text-accent">
          {t("nav.brand")}
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* 桌面：主导航链接；手机端不显示，底部栏已有 */}
          <div className="hidden md:flex items-center gap-1">
            {navKeys.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                aria-label={t(key)}
                title={t(key)}
                className={`flex items-center justify-center p-2 rounded-md transition hover:text-accent ${
                  pathname === href ? "text-accent" : "text-foreground/70"
                }`}
              >
                <NavIcon href={href} className="h-5 w-5 shrink-0" />
              </Link>
            ))}
          </div>

          {/* 中英日 + 手机端仅保留后台管理 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px]">
              {(["zh", "en", "ja"] as Locale[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={`px-1.5 py-0.5 transition hover:text-accent ${
                    locale === l ? "text-accent" : "text-foreground/50"
                  }`}
                >
                  {l === "zh" ? "中" : l === "en" ? "en" : "日"}
                </button>
              ))}
            </div>
            <Link
              href="/admin"
              aria-label={t("nav.admin")}
              title={t("nav.admin")}
              className="flex md:hidden items-center justify-center p-2 rounded-md transition hover:text-accent text-foreground/70"
            >
              <NavIcon href="/admin" className="h-5 w-5 shrink-0" />
            </Link>
          </div>

          {/* 已登录：桌面显示个人中心+登出；手机端仅底部栏有个人中心 */}
          {ready &&
            (authenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/me"
                  aria-label={t("nav.profile")}
                  title={t("nav.profile")}
                  className="flex items-center justify-center p-2 rounded-md transition hover:text-accent text-foreground/70"
                >
                  <NavIcon href="/me" className="h-5 w-5 shrink-0" />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs text-foreground/60 hover:text-accent"
                >
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="rounded-full border border-accent bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-black md:px-4 md:py-2"
                >
                  Login
                </button>
                {loginOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => setLoginOpen(false)}>
                    <div className="mx-4 w-full max-w-sm rounded-xl border border-foreground/20 bg-background p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                      <p className="mb-3 text-sm text-foreground/80">选择登录方式</p>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={handlePrivyLogin}
                          className="rounded-lg border border-accent bg-accent/10 py-2.5 text-sm font-medium text-accent hover:bg-accent hover:text-black"
                        >
                          {t("nav.loginEmailWallet")} / Farcaster
                        </button>
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          className="rounded-lg border border-foreground/30 bg-foreground/5 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/10"
                        >
                          Google
                        </button>
                      </div>
                      <button type="button" onClick={() => setLoginOpen(false)} className="mt-3 w-full text-xs text-foreground/50 hover:text-foreground">取消</button>
                    </div>
                  </div>
                )}
              </>
            ))}
        </div>
      </nav>
    </header>
  );
}
