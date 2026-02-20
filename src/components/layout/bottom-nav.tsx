"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-context";
import { NavIcon } from "./nav-icons";

/** 底部栏仅图标、无文字；个人中心在最后与其它栏目并列 */
const items = [
  { href: "/", key: "nav.home" },
  { href: "/log", key: "nav.log" },
  { href: "/community", key: "nav.community" },
  { href: "/members", key: "nav.members" },
  { href: "/dm", key: "nav.dm" },
  { href: "/intel", key: "nav.intel" },
  { href: "/settings", key: "nav.settings" },
  { href: "/me", key: "nav.profile" }, // 个人中心，最后一项
] as const;

const iconSize = "w-6 h-6";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const isMe = pathname === "/me" || pathname.startsWith("/u/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-foreground/10 bg-background/95 backdrop-blur safe-area-pb md:hidden" aria-label="主导航">
      <div className="flex h-14 min-h-14 items-center justify-between gap-0">
        {items.map(({ href, key }) => (
          <Link
            key={href}
            href={href}
            prefetch={false}
            aria-label={t(key)}
            className={`flex flex-1 min-w-0 items-center justify-center py-3 transition touch-manipulation ${
              (href === "/me" ? isMe : pathname === href) ? "text-accent" : "text-foreground/60"
            }`}
          >
            <NavIcon href={href} className={iconSize} />
          </Link>
        ))}
      </div>
    </nav>
  );
}
