import Link from "next/link";
import { CanmouHistorySection } from "./canmou-history-section";
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
          <p className="mt-3 text-xs leading-relaxed text-foreground/55">
            使用需登录。主问卷咨询每次消耗 10 济和币；主建议生成后的每条追问消耗 5 济和币。
          </p>
        </header>

        <CanmouHistorySection />

        {/* 生存手册 — 置顶入口 */}
        <Link
          href="/canmou/survival"
          className="block rounded-xl border border-red-500/40 bg-red-500/5 p-4 mb-6 transition hover:border-red-500/70 hover:bg-red-500/10 group"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🛡️</span>
            <span className="text-sm font-semibold text-red-400 group-hover:text-red-300">生存手册</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400/80">新</span>
          </div>
          <p className="text-xs text-foreground/55">
            执法盘查 · 劳动纠纷 · 物业对抗 · 行政维权 — 具体场景，直接出招
          </p>
        </Link>

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
