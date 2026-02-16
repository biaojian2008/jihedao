/**
 * 从 Privy user 对象中解析 Farcaster 数据（fid / displayName / 头像）
 * 兼容 user.farcaster、linkedAccounts 中 type===farcaster、或任意含 fid 的 linkedAccount
 */
export type FarcasterFields = {
  fid: string | undefined;
  display_name: string | undefined;
  avatar_url: string | undefined;
};

type FarcasterLike = {
  fid?: number | null;
  displayName?: string | null;
  display_name?: string | null;
  pfp?: string | null;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
};

type PrivyUserLike = {
  farcaster?: FarcasterLike;
  linkedAccounts?: Array<FarcasterLike & { type?: string }>;
  name?: string | null;
  avatar?: string | null;
};

function hasFid(a: unknown): a is FarcasterLike {
  return (
    typeof a === "object" &&
    a !== null &&
    "fid" in a &&
    (typeof (a as { fid?: number }).fid === "number" || (a as { fid?: number }).fid === null)
  );
}

function pickDisplayName(fc: FarcasterLike | undefined, user: PrivyUserLike): string | undefined {
  const fromUser = user.name != null && user.name !== "" ? user.name : undefined;
  if (fromUser) return fromUser;
  if (!fc) return undefined;
  const fromFc =
    (fc.displayName != null && fc.displayName !== "" ? fc.displayName : undefined) ??
    (fc.display_name != null && fc.display_name !== "" ? fc.display_name : undefined);
  return fromFc ?? undefined;
}

function pickAvatarUrl(fc: FarcasterLike | undefined, user: PrivyUserLike): string | undefined {
  const fromUser = user.avatar != null && user.avatar !== "" ? user.avatar : undefined;
  if (fromUser) return fromUser;
  if (!fc) return undefined;
  const url =
    (fc.pfp != null && fc.pfp !== "" ? fc.pfp : undefined) ??
    (fc.profile_picture_url != null && fc.profile_picture_url !== "" ? fc.profile_picture_url : undefined) ??
    (fc.profile_picture != null && fc.profile_picture !== "" ? fc.profile_picture : undefined);
  return url ?? undefined;
}

export function getFarcasterFromPrivyUser(user: PrivyUserLike | null | undefined): FarcasterFields | null {
  if (!user) return null;
  let fc: FarcasterLike | undefined =
    user.farcaster ??
    user.linkedAccounts?.find((a) => (a as { type?: string }).type === "farcaster") ??
    user.linkedAccounts?.find((a) => hasFid(a) && (a as { fid?: number }).fid != null);
  if (!fc && user.linkedAccounts) {
    const withFid = user.linkedAccounts.find((a) => hasFid(a));
    if (withFid) fc = withFid;
  }
  const fid = fc?.fid != null ? String(fc.fid) : undefined;
  const display_name = pickDisplayName(fc, user);
  const avatar_url = pickAvatarUrl(fc, user);
  return { fid, display_name, avatar_url };
}
