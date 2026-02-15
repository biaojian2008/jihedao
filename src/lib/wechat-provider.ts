/**
 * NextAuth v4 兼容的微信 OAuth 提供方（next-auth 官方包未包含 wechat，故本地实现）
 * 网站应用：open.weixin.qq.com 扫码登录
 * @see https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
 */
import type { OAuthConfig } from "next-auth/providers/oauth";
import type { TokenSetParameters } from "openid-client";

export type WeChatProviderOptions = {
  clientId: string;
  clientSecret: string;
  platformType?: "OfficialAccount" | "WebsiteApp";
};

const tokenUrl = "https://api.weixin.qq.com/sns/oauth2/access_token";
const userInfoUrl = "https://api.weixin.qq.com/sns/userinfo";

export function WeChat(options: WeChatProviderOptions): OAuthConfig<WeChatProfile> {
  const { clientId, clientSecret, platformType = "WebsiteApp" } = options;
  const isWebsite = platformType === "WebsiteApp";

  return {
    id: "wechat",
    name: "WeChat",
    type: "oauth",
    clientId,
    clientSecret,
    authorization: {
      url: isWebsite
        ? "https://open.weixin.qq.com/connect/qrconnect"
        : "https://open.weixin.qq.com/connect/oauth2/authorize",
      params: {
        appid: clientId,
        scope: isWebsite ? "snsapi_login" : "snsapi_userinfo",
        response_type: "code",
      },
    },
    token: {
      url: tokenUrl,
      async request({ params, provider }): Promise<{ tokens: TokenSetParameters }> {
        const code = (params as Record<string, string>).code ?? "";
        const appid = (provider as { clientId?: string }).clientId ?? clientId;
        const res = await fetch(
          `${tokenUrl}?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(clientSecret)}&code=${encodeURIComponent(code)}&grant_type=authorization_code`,
          { method: "GET" }
        );
        const data = (await res.json()) as Record<string, unknown>;
        if (data.errcode != null) {
          throw new Error(String(data.errmsg ?? data.errcode));
        }
        const tokens: TokenSetParameters = {
          access_token: data.access_token != null ? String(data.access_token) : undefined,
          refresh_token: data.refresh_token != null ? String(data.refresh_token) : undefined,
          expires_in: data.expires_in != null ? Number(data.expires_in) : undefined,
          scope: data.scope != null ? String(data.scope) : undefined,
          openid: data.openid != null ? String(data.openid) : undefined,
          unionid: data.unionid != null ? String(data.unionid) : undefined,
        };
        return { tokens };
      },
    },
    userinfo: {
      url: userInfoUrl,
      async request({ tokens }) {
        const openid = String((tokens as Record<string, unknown>).openid ?? "");
        const at = String(tokens.access_token ?? "");
        const res = await fetch(
          `${userInfoUrl}?access_token=${encodeURIComponent(at)}&openid=${encodeURIComponent(openid)}&lang=zh_CN`
        );
        const data = (await res.json()) as Record<string, unknown>;
        if (data.errcode != null) {
          throw new Error(String(data.errmsg ?? data.errcode));
        }
        return data;
      },
    },
    profile(profile: WeChatProfile) {
      return {
        id: profile.openid ?? (profile as Record<string, unknown>).unionid ?? "",
        name: profile.nickname ?? null,
        email: null,
        image: profile.headimgurl ?? null,
        openid: profile.openid,
        nickname: profile.nickname,
        headimgurl: profile.headimgurl,
      };
    },
    style: {
      logo: "/wechat.svg",
      bg: "#07c160",
      text: "#fff",
    },
    options,
  };
}

export interface WeChatProfile {
  openid: string;
  unionid?: string;
  nickname: string;
  headimgurl?: string;
  sex?: number;
  province?: string;
  city?: string;
  country?: string;
  privilege?: string[];
}
