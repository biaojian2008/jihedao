import { notFound } from "next/navigation";
import { LogDetailBack } from "@/components/log/log-detail-back";
import { fetchSkillById } from "@/lib/skills-queries";
import { SkillMarkdown } from "@/components/skills/skill-markdown";

type Props = { params: Promise<{ id: string }> };

export default async function SkillDetailPage({ params }: Props) {
  const { id } = await params;
  const skill = await fetchSkillById(id);
  if (!skill) notFound();

  const hasContent = Boolean(skill.content?.trim());

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <LogDetailBack />
        <article className="mt-4 rounded-xl border border-foreground/10 bg-black/40 p-6">
          <p className="text-[10px] uppercase tracking-wider text-accent/80">{skill.category_name ?? "未分类"}</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{skill.name}</h1>
          {skill.summary ? <p className="mt-3 text-sm text-foreground/75">{skill.summary}</p> : null}
          {skill.difficulty ? (
            <p className="mt-4 text-xs text-foreground/50">
              难度：<span className="text-foreground/80">{skill.difficulty}</span>
            </p>
          ) : null}
          <div className="mt-6 border-t border-foreground/10 pt-6">
            {hasContent ? (
              <SkillMarkdown content={skill.content!.trim()} />
            ) : (
              <p className="text-sm text-foreground/55">内容正在完善中</p>
            )}
          </div>
          {skill.resources?.trim() ? (
            <div className="mt-8 border-t border-foreground/10 pt-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent/80">参考资源</h2>
              <p className="whitespace-pre-wrap text-sm text-foreground/80">{skill.resources}</p>
            </div>
          ) : null}
        </article>
      </main>
    </div>
  );
}
