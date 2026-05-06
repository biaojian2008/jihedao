/**
 * /log — 超级个体技能库（URL 沿用原「官方日志」入口）
 */
import { fetchSkillCategoriesWithSkills } from "@/lib/skills-queries";
import { SkillsLibraryClient } from "@/components/skills/skills-library-client";

export default async function LogPage() {
  const categories = await fetchSkillCategoriesWithSkills();

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">超级个体技能库</h1>
          <p className="mt-2 text-sm text-foreground/70">系统失效时你依然能运作的能力</p>
        </header>
        <SkillsLibraryClient categories={categories} />
      </main>
    </div>
  );
}
