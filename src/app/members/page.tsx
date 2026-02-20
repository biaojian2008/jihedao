"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MemberCard } from "@/components/members/member-card";
import { GroupsList } from "@/components/groups/groups-list";
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

type Tab = "all" | "following" | "followers" | "groups" | "blocked";

export default function MembersPage() {
  const { t } = useLocale();
  const profileId = getCurrentProfileId();
  const [tab, setTab] = useState<Tab>("all");
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members", profileId],
    queryFn: async () => {
      const res = await fetch(profileId ? `/api/members?userId=${profileId}` : "/api/members");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<Member[]>;
    },
  });

  const { data: followData } = useQuery({
    queryKey: ["follows", profileId],
    queryFn: async () => {
      if (!profileId) return { following: [] as string[], followers: [] as string[] };
      const res = await fetch(`/api/follows?userId=${profileId}`);
      if (!res.ok) return { following: [], followers: [] };
      return res.json() as Promise<{ following: string[]; followers: string[] }>;
    },
    enabled: !!profileId,
  });

  const { data: blocksData } = useQuery({
    queryKey: ["blocks", profileId],
    queryFn: async () => {
      if (!profileId) return { blocked: [] as Member[] };
      const res = await fetch(`/api/blocks?userId=${profileId}`);
      if (!res.ok) return { blocked: [] };
      const d = await res.json();
      return { blocked: (d.blocked ?? []) as Member[] };
    },
    enabled: !!profileId,
  });

  const followingIds = new Set(followData?.following ?? []);
  const followerIds = new Set(followData?.followers ?? []);
  const blockedList = blocksData?.blocked ?? [];

  let list: Member[] = [];
  if (tab === "all") list = [...members];
  else if (tab === "following") list = members.filter((m) => followingIds.has(m.id));
  else if (tab === "followers") list = members.filter((m) => followerIds.has(m.id));
  else if (tab === "blocked") list = blockedList;

  const isGroupsTab = tab === "groups";

  const invalidateBlocks = () => {
    queryClient.invalidateQueries({ queryKey: ["blocks", profileId] });
    queryClient.invalidateQueries({ queryKey: ["members", profileId] });
  };

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <h1 className="mb-4 text-xl font-semibold text-foreground">{t("nav.members")}</h1>
        <div className="mb-4 flex gap-2 overflow-x-auto border-b border-foreground/10 pb-2">
          {(["all", "following", "followers", "groups", "blocked"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`shrink-0 rounded px-3 py-1.5 text-xs font-medium ${
                tab === value ? "bg-accent/20 text-accent" : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {value === "all" ? t("members.tabAll") : value === "following" ? t("members.tabFollowing") : value === "followers" ? t("members.tabFollowers") : value === "groups" ? t("members.tabGroups") : t("members.tabBlocked")}
            </button>
          ))}
        </div>
        {isGroupsTab ? (
          <GroupsList />
        ) : isLoading && tab !== "blocked" ? (
          <p className="text-sm text-foreground/60">{t("common.loading")}</p>
        ) : (
          <ul className="space-y-3">
            {list.map((m) => (
              <li key={m.id}>
                <MemberCard
                  member={m}
                  isBlockedTab={tab === "blocked"}
                  onUnblock={invalidateBlocks}
                />
              </li>
            ))}
          </ul>
        )}
        {!isGroupsTab && !isLoading && list.length === 0 && (
          <p className="text-sm text-foreground/50">
            {tab === "blocked" ? t("members.tabBlocked") + " 暂无" : "暂无"}
          </p>
        )}
      </main>
    </div>
  );
}
