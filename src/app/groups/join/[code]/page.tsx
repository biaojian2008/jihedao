"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function GroupJoinPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setErrorMsg("无效的邀请码");
      return;
    }
    fetch(`/api/groups/join/${code}`, { credentials: "include" })
      .then(async (r) => {
        const data = await r.json();
        if (r.status === 401) {
          setStatus("error");
          setErrorMsg(data?.hint ?? "请先登录");
          return;
        }
        if (data.group_id) {
          setGroupId(data.group_id);
          setStatus("ok");
          router.replace(`/groups/${data.group_id}`);
        } else {
          setStatus("error");
          setErrorMsg(data?.error ?? "加入失败");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("网络错误");
      });
  }, [code, router]);

  return (
    <div className="min-h-screen pt-14 pb-20 flex flex-col items-center justify-center px-4">
      {status === "loading" && <p className="text-sm text-foreground/60">正在加入群组…</p>}
      {status === "ok" && groupId && <p className="text-sm text-accent">已加入，正在跳转…</p>}
      {status === "error" && (
        <div className="text-center">
          <p className="text-sm text-red-500">{errorMsg}</p>
          <Link href="/members" className="mt-4 inline-block text-xs text-accent">返回成员页</Link>
        </div>
      )}
    </div>
  );
}
