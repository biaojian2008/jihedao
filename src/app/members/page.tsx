"use client";

import { useQuery } from "@tanstack/react-query";
import { MemberCard } from "@/components/members/member-card";
import { useLocale } from "@/lib/i18n/locale-context";
import { getCurrentProfileId } from "@/lib/current-user";

type Member = {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  fid: string | null;
  custom_did: string | null;
  credit_score: number;
  jihe_coin_balance: number;
  badges: { name: string; description: string | null; icon_url: string | null }[];
};

export default function MembersPage() {
  const { t } = useLocale();
  const profileId = getCurrentProfileId();
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await fetch("/api/members");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<Member[]>;
    },
  });
  const { data: myProfile } = useQuery({
    queryKey: ["user", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const res = await fetch(`/api/users/${profileId}`);
      if (!res.ok) return null;
      const p = await res.json();
      return {
        id: p.id,
        display_name: p.display_name ?? null,
        bio: p.bio ?? null,
        avatar_url: p.avatar_url ?? null,
        fid: p.fid ?? null,
        custom_did: p.custom_did ?? null,
        credit_score: p.credit_score ?? 0,
        jihe_coin_balance: p.jihe_coin_balance ?? 0,
        badges: Array.isArray(p.badges) ? p.badges : [],
      } as Member;
    },
    enabled: !!profileId,
  });

  const list = [...members];
  if (myProfile && profileId && !list.some((m) => m.id === profileId)) {
    list.unshift(myProfile);
  }

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <h1 className="mb-6 text-xl font-semibold text-foreground">
          {t("nav.members")}
        </h1>
        {isLoading && !myProfile ? (
          <p className="text-sm text-foreground/60">{t("common.loading")}</p>
        ) : (
          <ul className="space-y-3">
            {list.map((m) => (
              <li key={m.id}>
                <MemberCard member={m} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
