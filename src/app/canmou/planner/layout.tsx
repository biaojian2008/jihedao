import type { Metadata } from "next";

const TITLE = "孩子未来 · 全球发展规划器 · 济和";
const DESC =
  "根据孩子和家庭的真实条件，免费生成带时间轴的十年国际教育路线图：三套方案、各有代价与赌点，标明分岔口与不能失手的环节。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: {
    title: TITLE,
    description: DESC,
    url: "https://jihedao.xyz/canmou/planner",
    siteName: "济和",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESC,
  },
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
