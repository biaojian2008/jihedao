"use client";

import { TranslateButton } from "@/components/translate-button";

type Props = {
  text: string;
  className?: string;
  as?: "p" | "div";
};

/** 首页正文段落 + 翻译按钮，用于 hero 描述、介绍、四大板块等 */
export function HomeTranslatableText({ text, className, as: Tag = "p" }: Props) {
  if (!text?.trim()) return null;
  return (
    <div className={className}>
      <Tag className="whitespace-pre-line text-sm text-foreground/80 sm:text-base">{text}</Tag>
      <TranslateButton text={text} display="inline" className="mt-1.5 text-xs text-accent/90 hover:text-accent" />
    </div>
  );
}
