import Link from "next/link";
import { questionnaires } from "@/lib/questionnaires";

const cards: { domain: keyof typeof questionnaires; desc: string }[] = [
  { domain: "immigration", desc: "身份不绑定单一国家" },
  { domain: "assets", desc: "财富不被单一系统控制" },
  { domain: "tax", desc: "合法减少被系统抽取" },
  { domain: "offshore", desc: "用结构隔离风险保护资产" },
  { domain: "banking", desc: "金融不依赖单一机构" },
  { domain: "legal", desc: "用系统的规则对抗系统" },
  { domain: "medical", desc: "健康不依赖单一体系" },
  { domain: "education", desc: "下一代不被单一体系规训" },
];

export default function CanmouHomePage() {
  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">济和参谋</h1>
          <p className="mt-2 text-sm text-foreground/70">为超级个体提供专业咨询参谋</p>
        </header>

        <ul className="space-y-3">
          {cards.map(({ domain, desc }) => {
            const q = questionnaires[domain];
            return (
              <li key={domain}>
                <Link
                  href={`/canmou/${domain}`}
                  className="block rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4 transition hover:border-accent/50 hover:bg-foreground/[0.04]"
                >
                  <span className="text-sm font-medium text-accent">{q.name}</span>
                  <p className="mt-1 text-xs text-foreground/65">{desc}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
