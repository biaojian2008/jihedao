import type { Metadata } from "next";

const url = "https://jihedao.xyz/canmou/survival";

export const metadata: Metadata = {
  title: "生存手册 · 济和",
  description: "执法盘查、劳动纠纷、物业对抗、行政维权——输入场景，直接出招，具体步骤不说废话。",
  openGraph: {
    title: "🛡️ 生存手册 · 济和参谋",
    description: "执法盘查、劳动纠纷、物业对抗、行政维权——输入场景，直接出招，具体步骤不说废话。",
    url,
    siteName: "济和",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "🛡️ 生存手册 · 济和参谋",
    description: "执法盘查、劳动纠纷、物业对抗、行政维权——输入场景，直接出招",
  },
};

export default function SurvivalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
