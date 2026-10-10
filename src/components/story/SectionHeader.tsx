import type { ReactNode } from "react";

export function SectionHeader({
  part,
  id,
  title,
  children,
}: {
  part: string;
  id: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-heat">{part}</p>
      <h2 id={id} className="mt-3 max-w-3xl font-display text-4xl text-ink sm:text-5xl">
        {title}
      </h2>
      {children && <div className="mt-4 max-w-2xl leading-relaxed text-ink/80">{children}</div>}
    </>
  );
}
