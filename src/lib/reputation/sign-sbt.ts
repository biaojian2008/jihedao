/**
 * 前端 SBT 签发签名工具
 * 需配合 viem 的 useWalletClient 或 ethers 的 signer 使用
 */
import { type WalletClient, getAddress } from "viem";
import { mainnet } from "viem/chains";

export const EIP712_DOMAIN = {
  name: "JiheDAO",
  version: "1",
  chainId: mainnet.id,
} as const;

export const EIP712_SBT_TYPES = {
  SBTMint: [
    { name: "tokenId", type: "bytes32" },
    { name: "recipient", type: "address" },
    { name: "metadataHash", type: "bytes32" },
  ],
} as const;

/** 规范化 metadata 用于哈希 */
function canonicalMetadata(meta: Record<string, unknown>): string {
  const sorted: Record<string, unknown> = {};
  for (const k of Object.keys(meta).sort()) {
    sorted[k] = meta[k];
  }
  return JSON.stringify(sorted);
}

export async function signSBTMint(
  walletClient: WalletClient,
  recipientAddress: string,
  metadata: Record<string, unknown>,
  tokenId?: string
): Promise<{ signature: `0x${string}`; tokenId: string } | { error: string }> {
  const account = walletClient.account;
  if (!account) return { error: "未连接钱包" };

  const tid = tokenId ?? crypto.randomUUID();
  const tidHex = ("0x" + tid.replace(/-/g, "").padStart(64, "0").slice(0, 64)) as `0x${string}`;
  const metaStr = canonicalMetadata(metadata);

  const { keccak256, stringToHex } = await import("viem");
  const metadataHash = keccak256(stringToHex(metaStr));

  const recipient = getAddress(recipientAddress) as `0x${string}`;
  const message = {
    tokenId: tidHex,
    recipient,
    metadataHash,
  };

  try {
    const signature = await walletClient.signTypedData({
      account,
      domain: EIP712_DOMAIN,
      types: EIP712_SBT_TYPES,
      primaryType: "SBTMint",
      message,
    });
    return { signature, tokenId: tid };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
