"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { GroupChatView } from "@/components/groups/group-chat-view";

type GroupDetail = {
  id: string;
  name: string;
  members: { user_id: string; role: string; display_name: string; avatar_url: string | null }[];
  my_role: string;
};

export default function GroupPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<GroupDetail>;
    },
    enabled: !!id,
  });

  if (!id || isLoading) {
    return (
      <div className="min-h-screen pt-14 pb-20">
        <p className="p-8 text-center text-sm text-foreground/60">加载中…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-14 pb-20">
        <p className="p-8 text-center text-sm text-red-500">群组不存在或无权访问</p>
      </div>
    );
  }

  const canInvite = data.my_role === "owner" || data.my_role === "admin";

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <GroupChatView
        groupId={data.id}
        groupName={data.name}
        members={data.members}
        canInvite={canInvite}
      />
    </div>
  );
}
