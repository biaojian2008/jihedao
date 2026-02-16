"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

type Props = {
  text: string;
  className?: string;
  /** 翻译结果展示方式：inline 在按钮下方同一块内；block 独占一块 */
  display?: "inline" | "block";
};

export function TranslateButton({ text, className, display = "block" }: Props) {
  const { locale, t } = useLocale();
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showTranslated = translated !== null && !error;

  const handleTranslate = async () => {
    if (showTranslated) {
      setTranslated(null);
      setError(null);
      return;
    }
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), target: locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error ?? "Translation failed";
        setError(msg === "Translation service unavailable" ? t("translate.unavailable") : msg);
        return;
      }
      setTranslated(typeof data.translatedText === "string" ? data.translatedText : "");
    } catch {
      setError(t("translate.networkError"));
    } finally {
      setLoading(false);
    }
  };

  if (!text?.trim()) return null;

  return (
    <div className={display === "block" ? "mt-2" : undefined}>
      <button
        type="button"
        onClick={handleTranslate}
        disabled={loading}
        className={
          className ??
          "text-xs text-accent/90 hover:text-accent hover:underline disabled:opacity-60"
        }
      >
        {loading ? t("translate.loading") : showTranslated ? t("translate.showOriginal") : t("translate.button")}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-400/90">{error}</p>
      )}
      {showTranslated && translated !== "" && (
        <div className="mt-2 rounded border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm text-foreground/90 whitespace-pre-wrap">
          {translated}
        </div>
      )}
    </div>
  );
}
