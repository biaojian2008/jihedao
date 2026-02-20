"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

type Member = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Props = {
  groupId: string;
  existingIds: Set<string>;
  onClose: () => void;
  onAdded: () => void;
};

export function AddMemberModal({ groupId, existingIds, onClose, onAdded }: Props) {
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await fetch("/api/members");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Member[]>;
    },
  });

  const toAdd = members.filter((m) => !existingIds.has(m.id));

  const addMember = async (userId: string) => {
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      existingIds.add(userId);
      onAdded();
    } else {
      alert(data?.error ?? "添加失败");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[70vh] w-full max-w-sm overflow-hidden rounded-xl border border-foreground/20 bg-background" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-foreground/10 p-3">
          <h3 className="text-sm font-semibold">拉人进群</h3>
          <button type="button" onClick={onClose} className="text-xs text-foreground/60">关闭</button>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {isLoading ? (
            <p className="py-4 text-center text-xs text-foreground/60">加载中…</p>
          ) : toAdd.length === 0 ? (
            <p className="py-4 text-center text-xs text-foreground/60">暂无可添加的成员</p>
          ) : (
            <ul className="space-y-1">
              {toAdd.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => addMember(m.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-foreground/10"
                  >
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-foreground/20" />
                    )}
                    <span className="text-sm">{m.display_name ?? "匿名"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
