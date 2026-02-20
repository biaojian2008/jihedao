"use client";

import { ShareButton } from "@/components/share-button";

type Props = { logId: string; title: string; excerpt?: string };

export function LogShareButton({ logId, title, excerpt }: Props) {
  const url = `/log/${logId}`;
  return <ShareButton url={url} title={title} text={excerpt} />;
}
