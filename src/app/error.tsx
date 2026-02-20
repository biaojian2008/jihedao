"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-foreground">
      <h1 className="text-xl font-semibold text-accent mb-2">出错了</h1>
      <p className="text-sm text-foreground/70 mb-6 text-center max-w-md">
        页面加载时发生错误，请稍后重试或返回首页。
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
        >
          重试
        </button>
        <Link
          href="/"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
