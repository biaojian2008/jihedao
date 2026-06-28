import type { Metadata } from "next";
import { questionnaires } from "@/lib/questionnaires";

const domainDesc: Record<string, string> = {
  immigration: "身份不绑定单一国家，移民路径专业分析",
  assets: "财富不被单一系统控制，资产转移合规策略",
  tax: "合法减少被系统抽取，税务优化实操路径",
  offshore: "用结构隔离风险，离岸公司设立指南",
  banking: "金融不依赖单一机构，全球开户实战攻略",
  legal: "用系统的规则对抗系统，法律维权策略",
  medical: "健康不依赖单一体系，全球就医资源指南",
  education: "下一代不被单一体系规训，留学与教育主权",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const q = questionnaires[domain];
  const name = q?.name ?? "济和参谋";
  const desc = domainDesc[domain] ?? "为超级个体提供专业咨询参谋";
  const url = `https://jihedao.xyz/canmou/${domain}`;

  return {
    title: `${name} · 济和`,
    description: desc,
    openGraph: {
      title: `${name} · 济和参谋`,
      description: desc,
      url,
      siteName: "济和",
      type: "website",
      locale: "zh_CN",
    },
    twitter: {
      card: "summary",
      title: `${name} · 济和参谋`,
      description: desc,
    },
  };
}

export default function DomainLayout({ children }: { children: React.ReactNode }) {
  return children;
}
