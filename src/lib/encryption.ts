/**
 * 消息加密占位接口
 * TODO: 替换为真正的端到端加密（如用户私钥/链上密钥）。
 * 当前为占位：明文往返，仅用于协商室记录；未来可接入 AES + 密钥派生或 E2EE 方案。
 */

export function encryptPlaintext(_text: string, _key?: string): string {
  // TODO: 使用对称加密（如 AES-GCM）或与用户钱包关联的密钥加密
  return _text;
}

export function decryptPlaintext(_cipher: string, _key?: string): string {
  // TODO: 与 encrypt 配套解密
  return _cipher;
}
