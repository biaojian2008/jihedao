/**
 * 全局导航加载态：点击底部/顶部栏目时显示，避免长时间只看到 “Compiling…”
 */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-sm text-foreground/60">加载中…</p>
    </div>
  );
}
