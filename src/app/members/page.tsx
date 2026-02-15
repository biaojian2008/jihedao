"use client";

import { useQuery } from "@tanstack/react-query";
import { MemberCard } from "@/components/members/member-card";
import { useLocale } from "@/lib/i18n/locale-context";

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
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await fetch("/api/members");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<Member[]>;
    },
  });

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <h1 className="mb-6 text-xl font-semibold text-foreground">
          {t("nav.members")}
        </h1>
        {isLoading ? (
          <p className="text-sm text-foreground/60">{t("common.loading")}</p>
        ) : (
          <ul className="space-y-3">
            {members.map((m) => (
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
