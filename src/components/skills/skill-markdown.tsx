"use client";

import ReactMarkdown from "react-markdown";

/** Markdown 正文：与全站暗色 UI 一致 */
export function SkillMarkdown({ content }: { content: string }) {
  return (
    <div className="skill-md space-y-3 text-sm leading-relaxed text-foreground/85 [&_h1]:mt-6 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-foreground [&_h1]:first:mt-0 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-accent [&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_p]:mb-2 [&_p]:last:mb-0 [&_a]:text-accent [&_a]:underline-offset-2 [&_a]:hover:underline [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_blockquote]:border-l-2 [&_blockquote]:border-accent/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-foreground/70 [&_code]:rounded [&_code]:bg-foreground/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-foreground/15 [&_pre]:bg-black/50 [&_pre]:p-3 [&_pre]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_hr]:my-6 [&_hr]:border-foreground/15">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
