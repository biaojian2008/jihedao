"use client";

import { getCurrentProfileId } from "@/lib/current-user";
import { ReadwiseTokenSettings } from "./readwise-token-settings";
import { ReadwiseHighlights } from "./readwise-highlights";

type Props = { userId: string };

export function ReadwiseSection({ userId }: Props) {
  const isOwn = getCurrentProfileId() === userId;
  if (!isOwn) return null;
  return (
    <>
      <ReadwiseTokenSettings userId={userId} />
      <ReadwiseHighlights userId={userId} />
    </>
  );
}
