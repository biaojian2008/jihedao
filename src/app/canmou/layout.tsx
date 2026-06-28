import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "济和参谋 · jihedao.xyz",
  description: "为超级个体提供专业咨询参谋——移民、资产、税务、法律、医疗、教育，帮你在系统博弈中不处于信息劣势。",
  openGraph: {
    siteName: "济和",
    type: "website",
    locale: "zh_CN",
  },
};

export default function CanmouLayout({ children }: { children: React.ReactNode }) {
  return children;
}
