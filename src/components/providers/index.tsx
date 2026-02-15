"use client";

import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "./query-provider";
import { PrivyProvider } from "./privy-provider";
import { LocaleProvider } from "@/lib/i18n/locale-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <LocaleProvider>
        <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
          <PrivyProvider>{children}</PrivyProvider>
        </SessionProvider>
      </LocaleProvider>
    </QueryProvider>
  );
}
