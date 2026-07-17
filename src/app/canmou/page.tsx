import Link from "next/link";
import { CanmouHistorySection } from "./canmou-history-section";
import { questionnaires } from "@/lib/questionnaires";
import { ShareButton } from "@/components/share-button";

const cards: { domain: keyof typeof questionnaires; desc: string }[] = [
  { domain: "immigration", desc: "身份不绑定单一国家" },
  { domain: "assets", desc: "财富不被单一系统控制" },
  { domain: "tax", desc: "合法减少被系统抽取" },
  { domain: "offshore", desc: "用结构隔离风险保护资产" },
  { domain: "banking", desc: "金融不依赖单一机构" },
  { domain: "legal", desc: "用系统的规则对抗系统" },
  { domain: "medical", desc: "健康不依赖单一体系" },
];

export default function CanmouHomePage() {
  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">济和参谋</h1>
          <p className="mt-2 text-sm text-foreground/70">为超级个体提供专业咨询参谋</p>
          <p className="mt-3 text-xs leading-relaxed text-foreground/55">
            前 10 条消息免费，超出后每条消耗 10 济和币
          </p>
        </header>

        <CanmouHistorySection />

        {/* 生存手册 — 置顶入口 */}
        <div className="flex items-stretch gap-2 mb-6">
          <Link
            href="/canmou/survival"
            className="flex-1 rounded-xl border border-red-500/40 bg-red-500/5 p-4 transition hover:border-red-500/70 hover:bg-red-500/10 group"
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
          <ShareButton
            url="/canmou/survival"
            title="🛡️ 生存手册 · 济和参谋"
            text="执法盘查、劳动纠纷、物业对抗——输入场景，直接出招"
            claimReward
            className="flex-shrink-0 flex items-center justify-center w-10 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition"
          />
        </div>

        {/* 孩子未来规划器 — 免费测算入口 */}
        <div className="mb-6 flex items-stretch gap-2">
          <Link
            href="/canmou/planner"
            className="group flex-1 rounded-xl border border-accent/40 bg-accent/5 p-4 transition hover:border-accent/70 hover:bg-accent/10"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-base">🧭</span>
              <span className="text-sm font-semibold text-accent">孩子未来 · 全球发展规划器</span>
              <span className="ml-auto rounded bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent/80">免费</span>
            </div>
            <p className="text-xs text-foreground/55">
              录入家庭条件，生成带时间轴的十年路线图——三套方案，标明代价、赌点与不能失手的环节
            </p>
          </Link>
          <ShareButton
            url="/canmou/planner"
            title="🧭 孩子未来 · 全球发展规划器 · 济和"
            text="免费测算：三套方案的十年国际教育路线图，标明代价、赌点与分岔口"
            claimReward
            className="flex w-10 flex-shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/5 text-accent/60 transition hover:bg-accent/10 hover:text-accent"
          />
        </div>

        <ul className="space-y-3">
          {cards.map(({ domain, desc }) => {
            const q = questionnaires[domain];
            return (
              <li key={domain} className="flex items-stretch gap-2">
                <Link
                  href={`/canmou/${domain}`}
                  className="flex-1 rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4 transition hover:border-accent/50 hover:bg-foreground/[0.04]"
                >
                  <span className="text-sm font-medium text-accent">{q.name}</span>
                  <p className="mt-1 text-xs text-foreground/65">{desc}</p>
                </Link>
                <ShareButton
                  url={`/canmou/${domain}`}
                  title={`${q.name} · 济和参谋`}
                  text={desc}
                  claimReward
                  className="flex-shrink-0 flex items-center justify-center w-10 rounded-xl border border-foreground/10 text-foreground/30 hover:text-foreground/60 hover:border-foreground/20 transition"
                />
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
