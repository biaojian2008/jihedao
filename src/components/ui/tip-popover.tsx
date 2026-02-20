"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  children: React.ReactNode;
  title: string;
  content: React.ReactNode;
  className?: string;
};

export function TipPopover({ children, title, content, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <div ref={ref} className={`relative inline ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="cursor-pointer touch-manipulation"
      >
        {children}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] max-w-[320px] rounded-lg border border-foreground/20 bg-black/95 p-3 text-left shadow-xl">
          <p className="text-xs font-semibold text-accent">{title}</p>
          <div className="mt-2 text-xs text-foreground/90 leading-relaxed">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
