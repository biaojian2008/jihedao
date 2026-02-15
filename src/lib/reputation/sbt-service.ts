/**
 * SBT 签发服务：权限校验 + 签名验证
 */
import { verifyTypedData, keccak256, stringToHex } from "viem";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ReputationEngine } from "./reputation-engine";

export const EIP712_DOMAIN = {
  name: "JiheDAO",
  version: "1",
  chainId: 1,
} as const;

export const EIP712_SBT_TYPES = {
  SBTMint: [
    { name: "tokenId", type: "bytes32" },
    { name: "recipient", type: "address" },
    { name: "metadataHash", type: "bytes32" },
  ],
} as const;

export type CreateSBTInput = {
  issuerAddress: string;
  recipientAddress: string;
  recipientUserId?: string;
  tokenId: string;
  metadata: Record<string, unknown>;
  signature: `0x${string}`;
};

/** 规范化 metadata 用于哈希（按 key 排序） */
function canonicalMetadata(meta: Record<string, unknown>): string {
  const sorted: Record<string, unknown> = {};
  for (const k of Object.keys(meta).sort()) {
    sorted[k] = meta[k];
  }
  return JSON.stringify(sorted);
}

export class SBTService {
  private reputation: ReputationEngine;

  constructor(private supabase: SupabaseClient) {
    this.reputation = new ReputationEngine(supabase);
  }

  /** 校验 EIP-712 签名（client 需使用相同 domain/types/message 签名） */
  async verifySignature(input: CreateSBTInput): Promise<{ ok: boolean; error?: string }> {
    const metaStr = canonicalMetadata(input.metadata);
    const metadataHash = keccak256(stringToHex(metaStr));
    const tokenIdHex = ("0x" + input.tokenId.replace(/-/g, "").padStart(64, "0").slice(0, 64)) as `0x${string}`;

    const message = {
      tokenId: tokenIdHex,
      recipient: input.recipientAddress as `0x${string}`,
      metadataHash,
    };

    try {
      const valid = await verifyTypedData({
        address: input.issuerAddress as `0x${string}`,
        domain: EIP712_DOMAIN,
        types: EIP712_SBT_TYPES,
        primaryType: "SBTMint",
        message,
        signature: input.signature,
      });
      return valid ? { ok: true } : { ok: false, error: "签名验证失败" };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  /** 创建 SBT（先校验权限 + 签名，再入库） */
  async createSBT(input: CreateSBTInput): Promise<{ ok: boolean; id?: string; error?: string }> {
    const minScore = 500; // 可配置

    const perm = await this.reputation.canIssue(input.issuerAddress, minScore);
    if (!perm.ok) {
      return { ok: false, error: perm.error };
    }

    const sigCheck = await this.verifySignature(input);
    if (!sigCheck.ok) {
      return { ok: false, error: sigCheck.error };
    }

    const { data, error } = await this.supabase
      .from("sbt_records")
      .insert({
        token_id: input.tokenId,
        issuer_address: input.issuerAddress,
        recipient_address: input.recipientAddress,
        recipient_user_id: input.recipientUserId ?? null,
        metadata: input.metadata,
        issuer_score_at_mint: perm.score,
        signature: input.signature,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data.id };
  }
}
