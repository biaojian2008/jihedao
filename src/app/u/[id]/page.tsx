/**
 * 个人名片 - FID、钱包、SBT 勋章墙、信用评分
 * 数据来自 Supabase user_profiles + user_badges
 * dynamic 避免缓存导致保存头像/昵称后返回仍显示旧数据
 */
export const dynamic = "force-dynamic";

import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { ProfileCard } from "@/components/profile/profile-card";
import { getDisplayNameOrDid } from "@/lib/did";
import { getDisplayNameOrDid } from "@/lib/did";
import { UserDIDView } from "@/components/reputation/user-did-view";

type Props = { params: Promise<{ id: string }> };

const fallback = {
  display_name: "济和",
  bio: "协作与信用的实验场。",
  wallet_address: null as string | null,
  fid: null as string | null,
  custom_did: null as string | null,
  avatar_url: null as string | null,
  credit_score: 50,
  jihe_coin_balance: 0,
  badges: [
    { name: "早期共建", description: "济和 DAO 首批参与者", icon_url: null },
  ] as { name: string; description: string | null; icon_url: string | null }[],
};

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;
  let profile = fallback;

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createServerSupabase();
      const { data: p, error } = await supabase
        .from("user_profiles")
        .select("id, display_name, bio, wallet_address, fid, custom_did, avatar_url, credit_score, jihe_coin_balance")
        .eq("id", id)
        .single();
      if (error || !p) {
        if (error?.code === "PGRST116") notFound();
        throw error;
      }
      const { data: badges } = await supabase
        .from("user_badges")
        .select("name, description, icon_url")
        .eq("user_id", id);
      profile = {
        display_name: getDisplayNameOrDid({ id: p.id ?? id, display_name: p.display_name, fid: p.fid, custom_did: (p as { custom_did?: string | null }).custom_did }),
        bio: p.bio,
        wallet_address: p.wallet_address,
        fid: p.fid != null ? String(p.fid) : null,
        custom_did: (p as { custom_did?: string | null }).custom_did ?? null,
        avatar_url: p.avatar_url,
        credit_score: (p.credit_score as number) ?? 50,
        jihe_coin_balance: Number((p as { jihe_coin_balance?: number }).jihe_coin_balance ?? 0),
        badges: (badges ?? []).map((b) => ({
          name: b.name,
          description: b.description,
          icon_url: b.icon_url,
        })),
      };
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "PGRST116") notFound();
  }

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 space-y-6">
        <ProfileCard profile={profile} userId={id} />
        <UserDIDView userId={id} walletAddress={profile.wallet_address} />
      </main>
    </div>
  );
}
