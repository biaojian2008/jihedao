"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function AdminGuard({ children, fallback = null }: Props) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => setIsAdmin(r.ok))
      .catch(() => setIsAdmin(false));
  }, []);

  if (isAdmin === null) return fallback;
  if (!isAdmin) return fallback;
  return <>{children}</>;
}

type LinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function AdminLink({ href, children, className = "" }: LinkProps) {
  return (
    <AdminGuard fallback={null}>
      <Link href={href} className={className}>
        {children}
      </Link>
    </AdminGuard>
  );
}
