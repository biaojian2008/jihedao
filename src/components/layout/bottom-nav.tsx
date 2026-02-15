"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-context";
import { NavIcon } from "./nav-icons";

const items = [
  { href: "/", key: "nav.home" },
  { href: "/log", key: "nav.log" },
  { href: "/community", key: "nav.community" },
  { href: "/members", key: "nav.members" },
  { href: "/dm", key: "nav.dm" },
  { href: "/me", key: "nav.profile" },
] as const;

const iconSize = "w-6 h-6";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-foreground/10 bg-background/95 backdrop-blur safe-area-pb md:hidden" aria-label="主导航">
      <div className="flex h-14 items-center justify-around">
        {items.map(({ href, key }) => (
          <Link
            key={href}
            href={href}
            aria-label={t(key)}
            className={`flex flex-1 items-center justify-center transition ${
              pathname === href ? "text-accent" : "text-foreground/60"
            }`}
          >
            <NavIcon href={href} className={iconSize} />
          </Link>
        ))}
      </div>
    </nav>
  );
}
