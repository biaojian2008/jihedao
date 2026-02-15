/**
 * 交流：会话列表；?with=userId 时创建/跳转会话
 */
import { Suspense } from "react";
import { DmInbox } from "@/components/dm/dm-inbox";
import { DmPageTitle } from "@/components/dm/dm-page-title";

export default function DmPage() {
  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <DmPageTitle />
        <Suspense fallback={<div className="animate-pulse rounded-xl bg-foreground/5 h-48" />}>
          <DmInbox />
        </Suspense>
      </main>
    </div>
  );
}
