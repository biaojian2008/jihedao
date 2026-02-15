"use client";

import { useRef, useEffect, useState } from "react";
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
  { href: "/admin", key: "nav.admin" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const { ready, authenticated, login, loginWithWechat, logout } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const [loginOpen, setLoginOpen] = useState(false);
  const [wechatSignInUrl, setWechatSignInUrl] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const base = window.location.origin;
      setWechatSignInUrl(
        `${base}/api/auth/signin/wechat?callbackUrl=${encodeURIComponent(base + "/")}`
      );
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLoginOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

          {/* 桌面：个人中心/登录；手机端不显示，底部栏有个人中心 */}
          {ready &&
            (authenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/me"
                  className="rounded-full border border-foreground/20 px-3 py-1.5 text-xs"
                >
                  {t("nav.profile")}
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
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setLoginOpen((o) => !o)}
                  className="rounded-full border border-accent bg-accent/10 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent hover:text-black"
                >
                  {t("nav.login")}
                </button>
                {loginOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-foreground/10 bg-background py-1 shadow-lg">
                    {loginWithWechat && (
                      wechatSignInUrl ? (
                        <a
                          href={wechatSignInUrl}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-foreground hover:bg-foreground/5"
                          onClick={() => setLoginOpen(false)}
                        >
                          <span className="text-[#07c160]">●</span>
                          {t("nav.loginWechat")}
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-foreground hover:bg-foreground/5"
                          onClick={() => {
                            setLoginOpen(false);
                            const b = window.location.origin;
                            window.location.href = `${b}/api/auth/signin/wechat?callbackUrl=${encodeURIComponent(b + "/")}`;
                          }}
                        >
                          <span className="text-[#07c160]">●</span>
                          {t("nav.loginWechat")}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-foreground hover:bg-foreground/5"
                      onClick={() => {
                        setLoginOpen(false);
                        login();
                      }}
                    >
                      {t("nav.loginEmailWallet")}
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      </nav>
    </header>
  );
}
