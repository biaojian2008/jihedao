/**
 * 社区帖子 API
 * GET: 列表，支持 type、q 查询，按 credit_weight 降序、created_at 降序
 * POST: 发布（需 author_id，MVP 由前端传入；支持抵押、参加者冻结、智能合约等）
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveText, type Locale } from "@/lib/i18n/resolve";
import { getDisplayNameOrDid } from "@/lib/did";
import {
  JIHE_COIN_REASONS,
  JIHE_COIN_RULES,
  awardCoins,
  deductCoins,
  ESCROW_USER_ID,
} from "@/lib/jihe-coin";
import { generateContractText } from "@/lib/contract-generator";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const LOCALE_COOKIE = "jihe_locale";

function getLocaleFromRequest(request: NextRequest): Locale {
  const urlLocale = request.nextUrl.searchParams.get("locale");
  if (urlLocale === "zh" || urlLocale === "en" || urlLocale === "ja") return urlLocale;
  const cookie = request.headers.get("cookie") ?? "";
  const m = cookie.match(new RegExp(`(^| )${LOCALE_COOKIE}=([^;]+)`));
  const v = m?.[2];
  if (v === "zh" || v === "en" || v === "ja") return v;
  return "zh";
}

export async function GET(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  const supabase = createClient(url, key);
  const locale = getLocaleFromRequest(request);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "";
  const q = searchParams.get("q") || "";
  const userId = searchParams.get("userId") || "";
  const feed = searchParams.get("feed") || "all";

  let blockedAuthorIds: string[] = [];
  if (userId) {
    const { data: blocks } = await supabase.from("user_blocks").select("blocked_user_id").eq("user_id", userId);
    blockedAuthorIds = (blocks ?? []).map((b: { blocked_user_id: string }) => b.blocked_user_id);
  }

  let followingIds: string[] = [];
  if (userId && (feed === "following" || feed === "all")) {
    const { data: followRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    followingIds = (followRows ?? []).map((r) => r.following_id);
  }

  let postIdsFilter: string[] | null = null;
  if (userId && (feed === "saved" || feed === "liked" || feed === "commented" || feed === "mine")) {
    if (feed === "mine") {
      postIdsFilter = []; // will filter by author_id in query
    } else if (feed === "saved") {
      const { data: saved } = await supabase.from("saved_posts").select("post_id").eq("user_id", userId);
      postIdsFilter = (saved ?? []).map((r: { post_id: string }) => r.post_id);
    } else if (feed === "liked") {
      const { data: liked } = await supabase.from("likes").select("post_id").eq("user_id", userId);
      postIdsFilter = (liked ?? []).map((r: { post_id: string }) => r.post_id);
    } else if (feed === "commented") {
      const { data: commented } = await supabase.from("comments").select("post_id").eq("author_id", userId);
      postIdsFilter = [...new Set((commented ?? []).map((r: { post_id: string }) => r.post_id))];
    }
    if (postIdsFilter && postIdsFilter.length === 0 && feed !== "mine") return NextResponse.json([]);
  }

  let query = supabase
    .from("posts")
    .select("id, author_id, type, title, content, media_urls, tags, credit_weight, created_at, author_collateral, participant_freeze, expected_duration, returns_description, repay_when, details, contract_text")
    .order("credit_weight", { ascending: false })
    .order("created_at", { ascending: false });

  if (feed === "following" && userId && followingIds.length > 0) {
    query = query.in("author_id", followingIds);
  } else if (feed === "following" && userId && followingIds.length === 0) {
    return NextResponse.json([]);
  }
  if (feed === "mine" && userId) {
    query = query.eq("author_id", userId);
  }
  if (postIdsFilter && postIdsFilter.length > 0) {
    query = query.in("id", postIdsFilter);
  }
  if (type && ["project", "task", "product", "course", "service", "demand", "stance"].includes(type)) {
    query = query.eq("type", type);
  }
  if (q.trim()) {
    query = query.or(`title.ilike.%${q.trim()}%,content.ilike.%${q.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let rows = data || [];
  if (blockedAuthorIds.length > 0) {
    rows = rows.filter((r: { author_id: string }) => !blockedAuthorIds.includes(r.author_id));
  }
  if (feed === "all" && userId && followingIds.length > 0) {
    rows = [...rows].sort((a, b) => {
      const aFirst = followingIds.includes((a as { author_id: string }).author_id);
      const bFirst = followingIds.includes((b as { author_id: string }).author_id);
      if (aFirst && !bFirst) return -1;
      if (!aFirst && bFirst) return 1;
      return 0;
    });
  }
  const authorIds = [...new Set(rows.map((r: { author_id: string }) => r.author_id))];
  let profiles: Record<string, { id: string; display_name: string | null; fid: string | null; custom_did: string | null; credit_score: number }> = {};
  if (authorIds.length > 0) {
    const { data: profileList } = await supabase
      .from("user_profiles")
      .select("id, display_name, fid, custom_did, credit_score")
      .in("id", authorIds);
    for (const p of profileList || []) {
      profiles[p.id] = { id: p.id, display_name: p.display_name, fid: p.fid ?? null, custom_did: (p as { custom_did?: string | null }).custom_did ?? null, credit_score: p.credit_score ?? 0 };
    }
  }

  const postIds = rows.map((r: { id: string }) => r.id);
  let likeCounts: Record<string, number> = {};
  let commentCounts: Record<string, number> = {};
  let likedByMe: Record<string, boolean> = {};
  if (postIds.length > 0) {
    const { data: likeRows } = await supabase.from("likes").select("post_id").in("post_id", postIds);
    for (const r of likeRows ?? []) {
      likeCounts[r.post_id] = (likeCounts[r.post_id] ?? 0) + 1;
    }
    if (userId) {
      const { data: myLikes } = await supabase.from("likes").select("post_id").eq("user_id", userId).in("post_id", postIds);
      for (const r of myLikes ?? []) likedByMe[r.post_id] = true;
    }
    const { data: commentRows } = await supabase.from("comments").select("post_id").in("post_id", postIds);
    for (const r of commentRows ?? []) {
      commentCounts[r.post_id] = (commentCounts[r.post_id] ?? 0) + 1;
    }
  }

  const result = rows.map((row: Record<string, unknown> & { author_id: string; id: string }) => {
    const p = profiles[row.author_id];
    return {
      ...row,
      title: resolveText(row.title, locale),
      content: resolveText(row.content, locale),
      author_name: p ? getDisplayNameOrDid(p) : getDisplayNameOrDid({ id: row.author_id }),
      author_credit: p?.credit_score ?? row.credit_weight ?? 0,
      like_count: likeCounts[row.id] ?? 0,
      comment_count: commentCounts[row.id] ?? 0,
      liked_by_me: !!likedByMe[row.id],
    };
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  const supabase = createClient(url, key);
  const supabaseAdmin = serviceKey ? createClient(url, serviceKey) : null;
  let body: {
    author_id?: string;
    privy_user_id?: string;
    type: string;
    title: string;
    content: string;
    tags?: string[];
    media_urls?: string[];
    author_collateral?: number | string;
    participant_freeze?: number | string;
    expected_duration?: string;
    returns_description?: string;
    repay_when?: string;
    details?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const {
    author_id,
    privy_user_id,
    type,
    title,
    content,
    tags,
    media_urls,
    author_collateral,
    participant_freeze,
    expected_duration,
    returns_description,
    repay_when,
    details,
  } = body;
  if ((!author_id && !privy_user_id) || !type || !content) {
    return NextResponse.json(
      { error: "Missing author_id or privy_user_id, type or content" },
      { status: 400 }
    );
  }
  const effectiveTitle = type === "stance" && (!title || !title.trim()) ? (content.trim().slice(0, 80) || "观点") : (title ?? "").trim();
  if (type !== "stance" && !effectiveTitle) {
    return NextResponse.json(
      { error: "Missing title" },
      { status: 400 }
    );
  }
  const validTypes = ["project", "task", "product", "course", "service", "demand", "stance"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const coll = Math.max(0, Number(author_collateral) || 0);
  const freeze = Math.max(0, Number(participant_freeze) || 0);
  const needsCollateral = ["project", "task", "product", "course", "service", "demand"].includes(type);
  if (["project", "task"].includes(type)) {
    if (coll <= 0) {
      return NextResponse.json({ error: "项目/任务必须设置发布者抵押（济和币）" }, { status: 400 });
    }
    if (freeze <= 0) {
      return NextResponse.json({ error: "项目/任务必须设置参加者冻结金额（济和币）" }, { status: 400 });
    }
  }

  let resolvedAuthorId = author_id;
  if (!resolvedAuthorId && privy_user_id) {
    const { data: existing } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("privy_user_id", privy_user_id)
      .single();
    if (existing) {
      resolvedAuthorId = existing.id;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("user_profiles")
        .insert({
          privy_user_id,
          credit_score: 50,
        })
        .select("id")
        .single();
      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      resolvedAuthorId = inserted.id;
    }
  }
  if (!resolvedAuthorId) {
    return NextResponse.json(
      { error: "Missing author_id or privy_user_id" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("credit_score, jihe_coin_balance")
    .eq("id", resolvedAuthorId)
    .single();
  const credit_weight = (profile?.credit_score as number) ?? 50;

  const needsCollateralDeduct = needsCollateral && coll > 0;

  if (needsCollateral) {
    const balance = Number((profile as { jihe_coin_balance?: number })?.jihe_coin_balance ?? 0);
    if (balance < coll) {
      return NextResponse.json(
        { error: "济和币余额不足，无法抵押" },
        { status: 400 }
      );
    }
  }

  const contractInput = {
    type,
    title: effectiveTitle.slice(0, 500),
    content: content.slice(0, 10000),
    details: (details || "").slice(0, 5000),
    author_collateral: coll,
    participant_freeze: freeze,
    expected_duration: (expected_duration || "").slice(0, 200),
    returns_description: (returns_description || "").slice(0, 2000),
    repay_when: (repay_when || "项目完成").slice(0, 200),
  };
  const contractText = generateContractText(contractInput, "zh");

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: resolvedAuthorId,
      type,
      title: effectiveTitle.slice(0, 500),
      content: content.slice(0, 10000),
      tags: Array.isArray(tags) ? tags.slice(0, 20) : [],
      media_urls: Array.isArray(media_urls) ? media_urls : [],
      credit_weight,
      author_collateral: coll,
      participant_freeze: freeze,
      expected_duration: (expected_duration || "").slice(0, 200),
      returns_description: (returns_description || "").slice(0, 2000),
      repay_when: (repay_when || "项目完成").slice(0, 200),
      details: (details || "").slice(0, 5000),
      contract_text: contractText,
    })
    .select("id, title, created_at, author_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (needsCollateralDeduct && supabaseAdmin) {
    const deductRes = await deductCoins(supabaseAdmin, {
      userId: resolvedAuthorId,
      amount: coll,
      reason: "发布抵押",
      referenceType: "post_collateral",
      referenceId: data.id,
    });
    if (!deductRes.ok) {
      return NextResponse.json(
        { error: deductRes.error ?? "抵押失败" },
        { status: 400 }
      );
    }
    await awardCoins(supabaseAdmin, {
      userId: ESCROW_USER_ID,
      amount: coll,
      reason: "托管: 发布抵押",
      referenceType: "post_collateral",
      referenceId: data.id,
    }).catch(() => {});
  }

  const amount = JIHE_COIN_RULES[JIHE_COIN_REASONS.POST_CREATE] ?? 5;
  if (supabaseAdmin && amount > 0) {
    await awardCoins(supabaseAdmin, {
      userId: resolvedAuthorId,
      amount,
      reason: JIHE_COIN_REASONS.POST_CREATE,
      referenceType: "post",
      referenceId: data.id,
    }).catch(() => {});
  }

  return NextResponse.json({ ...data, author_id: resolvedAuthorId });
}
