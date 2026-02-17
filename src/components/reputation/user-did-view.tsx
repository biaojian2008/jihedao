"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type SBTRecord = {
  id: string;
  token_id: string;
  issuer_address: string;
  metadata: Record<string, unknown>;
  issuer_score_at_mint: number;
  created_at: string;
};

type IssuerInfo = {
  address: string;
  profile: { id: string; display_name: string | null; avatar_url: string | null; bio: string | null; credit_score: number } | null;
  reputation_score: number;
};

type Props = {
  userId: string;
  walletAddress?: string | null;
};

export function UserDIDView({ userId, walletAddress }: Props) {
  const [sbts, setSbts] = useState<SBTRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIssuer, setExpandedIssuer] = useState<string | null>(null);
  const [issuerCache, setIssuerCache] = useState<Record<string, IssuerInfo>>({});

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const sbtsRes = await fetch(`/api/sbt/list?recipientUserId=${userId}`);
        if (cancelled) return;
        if (sbtsRes.ok) {
          const list = await sbtsRes.json();
          setSbts(Array.isArray(list) ? list : []);
        } else {
          setSbts([]);
        }
      } catch {
        if (!cancelled) setSbts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const fetchIssuer = async (address: string) => {
    if (issuerCache[address]) return;
    const res = await fetch(`/api/reputation/issuer?address=${encodeURIComponent(address)}`);
    if (res.ok) {
      const data = await res.json();
      setIssuerCache((c) => ({ ...c, [address]: data }));
    }
  };

  const handleSbtClick = (address: string) => {
    setExpandedIssuer((prev) => (prev === address ? null : address));
    if (!issuerCache[address]) {
      fetchIssuer(address);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 rounded-xl border border-foreground/10 bg-black/40 p-6">
        <p className="text-sm text-foreground/60">加载中…</p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-foreground/10 bg-black/40 p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-accent/80">SBT</h2>
      <p className="mt-2 text-xs text-foreground/50">此处展示持有的 SBT 与签发方信誉；信誉分仅见上方个人名片。</p>

      {sbts.length > 0 ? (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-medium text-foreground/70">持有的 SBT</h3>
          <ul className="space-y-2">
            {sbts.map((sbt) => {
              const issuer = issuerCache[sbt.issuer_address];
              const hasFluctuation =
                issuer &&
                sbt.issuer_score_at_mint > 0 &&
                issuer.reputation_score < sbt.issuer_score_at_mint * 0.5;
              const meta = sbt.metadata ?? {};
              const title = (meta.title ?? meta.name ?? "SBT") as string;
              const desc = (meta.description ?? meta.desc ?? "") as string;
              const category = (meta.category ?? meta.tags ?? "default") as string;

              return (
                <li
                  key={sbt.id}
                  className="rounded-lg border border-foreground/15 bg-black/30 p-3"
                >
                  <button
                    type="button"
                    onClick={() => handleSbtClick(sbt.issuer_address)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{title}</p>
                        {desc && (
                          <p className="mt-0.5 text-xs text-foreground/60">{desc}</p>
                        )}
                        <p className="mt-1 text-[10px] text-foreground/40">{category}</p>
                      </div>
                      {hasFluctuation && (
                        <span className="shrink-0 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">
                          来源信用波动
                        </span>
                      )}
                    </div>
                  </button>
                  {expandedIssuer === sbt.issuer_address && (
                    <div className="mt-3 rounded border border-foreground/10 bg-black/40 p-3">
                      {issuer ? (
                        <>
                          <p className="text-xs font-medium text-accent/80">签发者</p>
                          {issuer.profile ? (
                            <Link
                              href={`/u/${issuer.profile.id}`}
                              className="mt-2 flex items-center gap-2 text-sm text-foreground hover:text-accent"
                            >
                              {issuer.profile.avatar_url && (
                                <img
                                  src={issuer.profile.avatar_url}
                                  alt=""
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium">
                                  {issuer.profile.display_name ?? "匿名"}
                                </p>
                                <p className="text-xs text-foreground/60">
                                  信誉分 {issuer.reputation_score} · 签发时 {sbt.issuer_score_at_mint}
                                </p>
                              </div>
                            </Link>
                          ) : (
                            <p className="mt-2 text-xs text-foreground/70">
                              地址 {sbt.issuer_address.slice(0, 10)}… · 信誉分 {issuer.reputation_score}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-foreground/60">加载中…</p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {!loading && sbts.length === 0 && (
        <p className="mt-4 text-xs text-foreground/50">暂无 SBT 记录</p>
      )}
    </div>
  );
}
