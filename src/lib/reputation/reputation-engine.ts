/**
 * 信誉计算引擎
 * Score = Σ (SBT_Weight * Issuer_Trust_Factor * Decay)
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type SBTRecord = {
  id: string;
  token_id: string;
  issuer_address: string;
  recipient_address: string;
  metadata: Record<string, unknown>;
  issuer_score_at_mint: number;
  created_at: string;
};

export type ReputationConfig = Record<string, number>;

const DEFAULT_MIN_SCORE_TO_ISSUE = 500;
const DECAY_DAYS = 180;
const MAX_SCORE_NORMALIZE = 1000;

/** 时间衰减：超过 180 天线性下降 */
function decayFactor(createdAt: string): number {
  const days = (Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000);
  if (days <= DECAY_DAYS) return 1;
  const extra = days - DECAY_DAYS;
  const decay = extra / (DECAY_DAYS * 2);
  return Math.max(0.2, 1 - decay);
}

/** 签发者信任系数：签发时分数越高，贡献越大 */
function issuerTrustFactor(issuerScoreAtMint: number): number {
  if (issuerScoreAtMint <= 0) return 0.3;
  return Math.min(1, issuerScoreAtMint / MAX_SCORE_NORMALIZE);
}

function getCategory(metadata: Record<string, unknown>): string {
  const cat = metadata?.category ?? metadata?.tags;
  if (typeof cat === "string") return cat;
  if (Array.isArray(cat) && cat.length > 0) return String(cat[0]);
  return "default";
}

function getSbtWeight(metadata: Record<string, unknown>): number {
  const w = metadata?.weight ?? metadata?.score;
  if (typeof w === "number" && w > 0) return w;
  if (typeof w === "string") return parseFloat(w) || 1;
  return 1;
}

export class ReputationEngine {
  constructor(
    private supabase: SupabaseClient,
    private config?: ReputationConfig
  ) {}

  private async getCategoryWeight(category: string): Promise<number> {
    if (this.config?.[category] != null) return this.config[category];
    const { data } = await this.supabase
      .from("reputation_config")
      .select("weight")
      .eq("category", category)
      .single();
    return (data?.weight as number) ?? 1;
  }

  async loadConfig(): Promise<ReputationConfig> {
    const { data } = await this.supabase.from("reputation_config").select("category, weight");
    const cfg: ReputationConfig = {};
    for (const row of data ?? []) {
      cfg[row.category] = Number(row.weight);
    }
    this.config = cfg;
    return cfg;
  }

  async getScore(address: string, options?: { recipientUserId?: string }): Promise<number> {
    await this.loadConfig();

    let query = this.supabase
      .from("sbt_records")
      .select("metadata, issuer_score_at_mint, created_at");

    if (options?.recipientUserId && address?.startsWith("0x")) {
      query = query.or(
        `recipient_user_id.eq.${options.recipientUserId},recipient_address.eq.${address}`
      );
    } else if (options?.recipientUserId) {
      query = query.eq("recipient_user_id", options.recipientUserId);
    } else if (address?.startsWith("0x")) {
      query = query.eq("recipient_address", address);
    } else if (address) {
      query = query.or(
        `recipient_address.eq.${address},recipient_user_id.eq.${address}`
      );
    }

    const { data: rows, error } = await query;
    if (error) return 0;
    if (!rows?.length) return 0;
    const seen = new Set<string>();
    const records = (rows as SBTRecord[]).filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    let total = 0;
    for (const r of records) {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const category = getCategory(meta);
      const weight = getSbtWeight(meta) * (await this.getCategoryWeight(category));
      const trust = issuerTrustFactor(r.issuer_score_at_mint ?? 0);
      const decay = decayFactor(r.created_at);
      total += weight * trust * decay;
    }

    return Math.round(total);
  }

  async canIssue(address: string, minScore = DEFAULT_MIN_SCORE_TO_ISSUE): Promise<{ ok: boolean; score: number; error?: string }> {
    const score = await this.getScore(address);
    if (score < minScore) {
      return { ok: false, score, error: "信誉分不足，无法发布项目/签发证明" };
    }
    return { ok: true, score };
  }
}
