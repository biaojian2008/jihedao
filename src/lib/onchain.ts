/**
 * Base 链存证预留
 * TODO: 接入 Base 链，对帖子/契约等写入 onchain_tx_hash。
 * 预期流程：构造 payload -> 签名/发送交易 -> 将 tx_hash 写回 posts 或 transactions 表。
 */

export const CHAIN_NAME = "base";

/**
 * 占位：将内容摘要存证到 Base，返回 tx_hash
 * TODO: 实现真实链上存证（如用 viem + Base RPC）
 */
export async function attestOnBase(_payload: { type: string; refId: string; digest?: string }): Promise<string | null> {
  // TODO: 调用 Base 链合约或 API，返回 transaction hash
  return null;
}
