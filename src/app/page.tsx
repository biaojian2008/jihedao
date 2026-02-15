import Link from "next/link";
import { cookies } from "next/headers";
import { HomePublishButton } from "@/components/home/home-publish-button";

type Locale = "zh" | "en" | "ja";
type CmsResolved = {
  hero_image_url: string;
  hero_title: string;
  hero_title_highlight: string;
  hero_subtitle: string;
  hero_description: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  galt_gulch_image_url: string;
  camp_image_url: string;
  intro_title: string;
  intro_body: string;
  highlights: { key: string; title: string; body: string }[];
};

function resolveValue(value: unknown, locale: Locale): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    return (o[locale] as string) ?? (o.zh as string) ?? (o.en as string) ?? (o.ja as string) ?? "";
  }
  return String(value);
}

const defaultByLocale: Record<Locale, CmsResolved> = {
  zh: {
    hero_image_url: "",
    hero_title: "超级个体们，欢迎来到高尔特峡谷",
    hero_title_highlight: "",
    hero_subtitle: "可否相济？和而不同。",
    hero_description:
      "在这里，你的项目、立场与信用会被完整记录；每一次协作、每一段对话，都可以成为未来契约的基础。",
    hero_cta_primary: "立即加入协作",
    hero_cta_secondary: "浏览社区动态",
    galt_gulch_image_url: "",
    camp_image_url: "",
    camp_media_urls: [],
    intro_title: "我们的介绍",
    intro_body: "济和营地是现实中的高尔特峡谷，汇聚长期主义者与超级个体，在协作与信用中探索数据主权与价值归属。",
    highlights: [
      { key: "COLLABORATION", title: "协作即资产", body: "通过项目、任务与课程，将松散关系沉淀为可追踪的协作网络。" },
      { key: "CREDIT", title: "信用驱动排序", body: "基于行为与贡献的信用分，决定你在时间线与检索中的位置。" },
      { key: "SOCIAL", title: "交流即协商室", body: "每一段对话都可以成为签署合约前的谈判记录，未来可选择链上加密存证。" },
      { key: "SOVEREIGN DATA", title: "数据主权在你手里", body: "所有内容托管在你可控的 Supabase 实例中，为未来迁移与自托管预留空间。" },
    ],
  },
  en: {
    hero_image_url: "",
    hero_title: "An online Galt's Gulch for super-individuals",
    hero_title_highlight: "",
    hero_subtitle: "Complement each other; stay different.",
    hero_description:
      "Your projects, stances and reputation are recorded; every collaboration and conversation can become the basis of future agreements.",
    hero_cta_primary: "Join now",
    hero_cta_secondary: "Browse community",
    galt_gulch_image_url: "",
    camp_image_url: "",
    camp_media_urls: [],
    intro_title: "About us",
    intro_body: "Jihe Camp is a real-world Galt's Gulch, where long-termists and super-individuals gather to explore data sovereignty and value through collaboration and trust.",
    highlights: [
      { key: "COLLABORATION", title: "Collaboration as asset", body: "Turn loose ties into a traceable network through projects, tasks and courses." },
      { key: "CREDIT", title: "Credit-driven ranking", body: "Your credit score from behavior and contribution shapes your position in feed and search." },
      { key: "SOCIAL", title: "DMs as negotiation room", body: "Every conversation can be the record before signing; optional on-chain attestation later." },
      { key: "SOVEREIGN DATA", title: "Your data, your control", body: "Content lives in your Supabase instance; migration and self-hosting remain possible." },
    ],
  },
  ja: {
    hero_image_url: "",
    hero_title: "スーパー個人のためのオンライン・ゴルト峡谷",
    hero_title_highlight: "",
    hero_subtitle: "可否相済、和而不同。",
    hero_description:
      "プロジェクト、スタンス、信用が記録され、協力と対話が将来の契約の基盤になります。",
    hero_cta_primary: "参加する",
    hero_cta_secondary: "コミュニティを見る",
    galt_gulch_image_url: "",
    camp_image_url: "",
    camp_media_urls: [],
    intro_title: "私たちについて",
    intro_body: "済和キャンプは現実のゴルト峡谷。長期主義者とスーパー個人が集い、協力と信用の中でデータ主権と価値を探求します。",
    highlights: [
      { key: "COLLABORATION", title: "協力即ち資産", body: "プロジェクト・タスク・講座で緩い関係を追跡可能なネットワークに。" },
      { key: "CREDIT", title: "信用でランク", body: "行動と貢献に基づく信用スコアがフィードと検索の順位を決めます。" },
      { key: "SOCIAL", title: "DMは交渉の場", body: "対話は契約前の記録として残し、将来的にオンチェーン存証も可能に。" },
      { key: "SOVEREIGN DATA", title: "データはあなたの手に", body: "コンテンツは Supabase に。移行とセルフホストの余地を残しています。" },
    ],
  },
};

const CMS_FETCH_TIMEOUT_MS = 5000;

async function getCms(locale: Locale): Promise<CmsResolved> {
  const defaultCms = defaultByLocale[locale] ?? defaultByLocale.zh;
  const fetchCms = async (): Promise<CmsResolved> => {
    try {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return defaultCms;
      const { data } = await supabase.from("cms_config").select("key, value");
      const raw: Record<string, unknown> = {};
      for (const row of data || []) {
        raw[row.key] = row.value;
      }
      const res: CmsResolved = {
        hero_image_url: resolveValue(raw.hero_image_url, locale) || defaultCms.hero_image_url,
        hero_title: resolveValue(raw.hero_title, locale) || defaultCms.hero_title,
        hero_title_highlight: resolveValue(raw.hero_title_highlight, locale) || defaultCms.hero_title_highlight,
        hero_subtitle: resolveValue(raw.hero_subtitle, locale) || defaultCms.hero_subtitle,
        hero_description: resolveValue(raw.hero_description, locale) || defaultCms.hero_description,
        hero_cta_primary: resolveValue(raw.hero_cta_primary, locale) || defaultCms.hero_cta_primary,
        hero_cta_secondary: resolveValue(raw.hero_cta_secondary, locale) || defaultCms.hero_cta_secondary,
        galt_gulch_image_url: resolveValue(raw.galt_gulch_image_url, locale) || defaultCms.galt_gulch_image_url,
        camp_image_url: resolveValue(raw.camp_image_url, locale) || defaultCms.camp_image_url,
        camp_media_urls: (() => {
          const v = raw.camp_media_urls;
          if (Array.isArray(v)) return v as string[];
          if (typeof v === "string") {
            try {
              const parsed = JSON.parse(v) as unknown;
              return Array.isArray(parsed) ? (parsed as string[]) : [];
            } catch {
              return [];
            }
          }
          return [];
        })(),
        intro_title: resolveValue(raw.intro_title, locale) || defaultCms.intro_title,
        intro_body: resolveValue(raw.intro_body, locale) || defaultCms.intro_body,
        highlights: defaultCms.highlights,
      };
      if (Array.isArray(raw.highlights) && raw.highlights.length > 0) {
        res.highlights = (raw.highlights as Record<string, unknown>[]).map((h) => {
          const title = resolveValue((h as { title?: unknown }).title, locale);
          const body = resolveValue((h as { body?: unknown }).body, locale);
          const key = (h as { key?: string }).key ?? "";
          return {
            key,
            title: title || (defaultCms.highlights.find((d) => d.key === key)?.title ?? ""),
            body: body || (defaultCms.highlights.find((d) => d.key === key)?.body ?? ""),
          };
        });
      }
      return res;
    } catch {
      return defaultCms;
    }
  };
  try {
    return await Promise.race([
      fetchCms(),
      new Promise<CmsResolved>((resolve) =>
        setTimeout(() => resolve(defaultCms), CMS_FETCH_TIMEOUT_MS)
      ),
    ]);
  } catch {
    return defaultCms;
  }
}

/** 底部四大板块固定文案（你提供的文字） */
const BOTTOM_SECTIONS = {
  one: {
    title: "为什么构建「济和 DAO」？",
    body: "在传统体系下，个体的卓越被标准化考试抹杀，信用被中心化机构剥夺。我们构建济和 DAO，是为了让超级个体拿回评价权与数字主权，在数字荒原中建立一个基于自由意志的自治区。",
  },
  two: {
    title: "济和 DAO 的核心组件",
    items: [
      { name: "技能存证 (SBT)", desc: "不可篡改的「灵魂护照」，记录你真实的成长轨迹。" },
      { name: "主权社交 (Farcaster)", desc: "去中心化协议，确保你的社交资产不被任何平台封禁。" },
      { name: "济和币 (Jihe Coin)", desc: "峡谷内的价值血液，衡量贡献、交换资源、参与治理。" },
    ],
  },
  three: {
    title: "它是如何运作的？我们怎么使用它？",
    items: [
      { name: "身份激活", desc: "通过 Farcaster 或邮箱登录，你即刻签署了峡谷协议，获得唯一的数字身份。" },
      { name: "技能沉淀", desc: "当你在现实或数字世界完成一次创造或探索，系统会为你发放对应的 SBT，这些资产永久锁定在你的钱包中，成为你真实的信用资产。" },
      { name: "价值流转", desc: "通过参与协作与贡献，你将获得济和币。你可以用它在峡谷内兑换 LUMI 能量补给、营地资源，与其他超级个体交换，或者支持其他超级个体的项目。" },
      { name: "自主协作", desc: "利用 DAO 提供的协议工具，你可以发起自己的实验，寻找志同道合的超级个体，实现高效的去中心化协作。" },
    ],
  },
  four: {
    title: "落地实体：德阳济和营地",
    lead: "「峡谷」在云端，根在德阳。",
    items: [
      { name: "集合营地", desc: "济和 DAO 的物理实验场。我们在这里进行童军训练与野外造作。" },
      { name: "能量补给", desc: "由 LUMI 德阳本地牧场提供最纯粹的能量支撑。" },
      { name: "核心理念", desc: "「学习只是成长的副产品」。在德阳的土地上造作，在数字的峡谷中永存。" },
    ],
  },
} as const;

export default async function Home() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("jihe_locale")?.value as Locale) || "zh";
  const validLocale: Locale = locale === "en" || locale === "ja" ? locale : "zh";
  const cms = await getCms(validLocale);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 pb-16 pt-20 sm:px-6 sm:pt-24">
        <section className="space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-accent/80">JIHE DAO</p>
          {cms.hero_image_url ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-foreground/10">
              {/\.(mp4|webm|mov|ogg)(\?|$)/i.test(cms.hero_image_url) ? (
                <video src={cms.hero_image_url} className="h-full w-full object-cover" muted loop autoPlay playsInline />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={cms.hero_image_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          ) : null}
          <h1 className="text-4xl font-semibold leading-tight text-accent sm:text-5xl">
            {cms.hero_title}
            {cms.hero_title_highlight ? (
              <>
                {" "}
                <span className="text-accent">{cms.hero_title_highlight}</span>
              </>
            ) : null}
            <span className="mt-2 block text-base font-normal text-foreground/70 sm:text-lg">
              {cms.hero_subtitle}
            </span>
          </h1>
          <p className="max-w-xl text-sm text-foreground/70 sm:text-base">
            {cms.hero_description}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/community"
              className="rounded-full border border-accent bg-accent px-6 py-2 text-xs font-semibold text-black transition hover:bg-transparent hover:text-accent"
            >
              {cms.hero_cta_primary}
            </Link>
            <Link
              href="/community"
              className="rounded-full border border-foreground/30 px-6 py-2 text-xs font-semibold text-foreground/80 transition hover:border-accent/60 hover:text-accent"
            >
              {cms.hero_cta_secondary}
            </Link>
          </div>
        </section>

        {cms.galt_gulch_image_url ? (
          <section className="mt-12 sm:mt-16">
            <p className="mb-2 text-xs uppercase tracking-wider text-foreground/50">现实中的济和营地</p>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-foreground/10">
              {/\.(mp4|webm|mov|ogg)(\?|$)/i.test(cms.galt_gulch_image_url) ? (
                <video src={cms.galt_gulch_image_url} className="h-full w-full object-cover" muted loop autoPlay playsInline />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={cms.galt_gulch_image_url} alt="现实中的济和营地" className="h-full w-full object-cover" />
              )}
            </div>
          </section>
        ) : null}

        <section className="mt-12 grid gap-4 text-xs sm:mt-16 sm:grid-cols-2 sm:text-sm">
          {cms.highlights.map((h) => (
            <div
              key={h.key}
              className="rounded-xl border border-foreground/10 bg-black/40 p-4"
            >
              <p className="mb-1 text-[0.7rem] uppercase tracking-[0.2em] text-accent/80">
                {h.key}
              </p>
              <h2 className="mb-2 text-base font-semibold text-accent">
                {h.title}
              </h2>
              <p className="text-foreground/70">{h.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-xl border border-foreground/10 bg-black/40 p-6 sm:mt-16">
          <h2 className="mb-3 text-lg font-semibold text-foreground">{cms.intro_title}</h2>
          <p className="whitespace-pre-line text-sm text-foreground/80">{cms.intro_body}</p>
        </section>

        {cms.galt_gulch_image_url ? (
          <section className="mt-12 sm:mt-16">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-foreground/10">
              {/\.(mp4|webm|mov|ogg)(\?|$)/i.test(cms.galt_gulch_image_url) ? (
                <video src={cms.galt_gulch_image_url} className="h-full w-full object-cover" muted loop autoPlay playsInline />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={cms.galt_gulch_image_url} alt="现实中的济和营地" className="h-full w-full object-cover" />
              )}
            </div>
          </section>
        ) : null}

        {/* 以下为你提供的四大板块文案，沿用页面既有风格 */}
        <section className="mt-12 rounded-xl border border-foreground/10 bg-black/40 p-6 sm:mt-16">
          <h2 className="mb-3 text-lg font-semibold text-accent">{BOTTOM_SECTIONS.one.title}</h2>
          <p className="text-sm leading-relaxed text-foreground/70">{BOTTOM_SECTIONS.one.body}</p>
        </section>

        <section className="mt-6 rounded-xl border border-foreground/10 bg-black/40 p-6">
          <h2 className="mb-4 text-lg font-semibold text-accent">{BOTTOM_SECTIONS.two.title}</h2>
          <div className="space-y-3 text-sm">
            {BOTTOM_SECTIONS.two.items.map((item) => (
              <div key={item.name}>
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="mt-0.5 text-foreground/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-foreground/10 bg-black/40 p-6">
          <h2 className="mb-4 text-lg font-semibold text-accent">{BOTTOM_SECTIONS.three.title}</h2>
          <div className="space-y-3 text-sm">
            {BOTTOM_SECTIONS.three.items.map((item) => (
              <div key={item.name}>
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="mt-0.5 text-foreground/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-foreground/10 bg-black/40 p-6">
          <h2 className="mb-2 text-lg font-semibold text-accent">{BOTTOM_SECTIONS.four.title}</h2>
          <p className="mb-4 text-sm italic text-foreground/60">{BOTTOM_SECTIONS.four.lead}</p>
          <div className="space-y-3 text-sm">
            {BOTTOM_SECTIONS.four.items.map((item) => (
              <div key={item.name}>
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="mt-0.5 text-foreground/70">{item.desc}</p>
              </div>
            ))}
          </div>
          {(cms.camp_media_urls?.length ? cms.camp_media_urls : cms.camp_image_url ? [cms.camp_image_url] : []).map((url, i) => (
            <div key={i} className="mt-4 overflow-hidden rounded-xl border border-foreground/10">
              {/\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) ? (
                <video src={url} className="w-full object-cover" muted loop autoPlay playsInline />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={url} alt="德阳济和营地" className="w-full object-cover" />
              )}
            </div>
          ))}
        </section>
      </main>
      <HomePublishButton />
    </div>
  );
}
