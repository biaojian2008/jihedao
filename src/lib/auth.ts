/**
 * NextAuth 配置（微信登录）
 * 与 Privy 并存：微信用户走 NextAuth session，其余走 Privy
 * 使用本地 WeChat 提供方（next-auth 官方包未包含 wechat）
 */
import type { NextAuthOptions } from "next-auth";
import { WeChat } from "@/lib/wechat-provider";

const wechatId = process.env.AUTH_WECHAT_APP_ID;
const wechatSecret = process.env.AUTH_WECHAT_APP_SECRET;

declare module "next-auth" {
  interface User {
    openid?: string;
    nickname?: string;
    headimgurl?: string;
  }
  interface Session {
    user: { name?: string | null; email?: string | null; image?: string | null; openid?: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    openid?: string;
    nickname?: string;
    headimgurl?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers:
    wechatId && wechatSecret
      ? [
          WeChat({
            clientId: wechatId,
            clientSecret: wechatSecret,
            // 网站应用：扫码登录；公众号用 "OfficialAccount"
            platformType: "WebsiteApp",
          }),
        ]
      : [],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (profile && typeof profile === "object" && "openid" in profile) {
        token.openid = (profile as { openid?: string }).openid;
        token.nickname = (profile as { nickname?: string }).nickname;
        token.headimgurl = (profile as { headimgurl?: string }).headimgurl;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.openid = token.openid;
        session.user.name = token.nickname ?? session.user.name;
        session.user.image = token.headimgurl ?? session.user.image;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
