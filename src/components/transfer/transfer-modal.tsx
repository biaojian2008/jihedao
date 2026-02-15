"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

type Props = {
  toUserId: string;
  toUserName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function TransferModal({ toUserId, toUserName, onClose, onSuccess }: Props) {
  const { t } = useLocale();
  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/jihe-coin/balance", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { balance: 0 }))
      .then((d) => setBalance(Number(d.balance) || 0))
      .catch(() => setBalance(0));
  }, []);

  const num = Number(amount);
  const currentBalance = balance ?? 0;
  const valid = Number.isFinite(num) && num > 0 && num <= currentBalance;

  const submit = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jihe-coin/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to_user_id: toUserId, amount: num }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "转账失败");
        return;
      }
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border border-foreground/10 bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-foreground">{t("profile.transfer")} · 济和币</h3>
        <p className="mt-1 text-sm text-foreground/70">
          转给 {toUserName || "用户"}
        </p>
        <p className="mt-2 text-xs text-foreground/50">当前余额：{balance === null ? "…" : `${currentBalance} 济和币`}</p>
        <input
          type="number"
          min={0}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="输入金额"
          className="mt-4 w-full rounded-lg border border-foreground/20 bg-black/40 px-4 py-3 text-foreground placeholder:text-foreground/40"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-foreground/20 py-2 text-sm font-medium text-foreground"
          >
            取消
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || loading}
            className="flex-1 rounded-lg border border-accent bg-accent py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {loading ? "…" : "确认转账"}
          </button>
        </div>
      </div>
    </div>
  );
}
