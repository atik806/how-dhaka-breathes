"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useEffect, useState } from "react";

const CHAPTERS = [
  { id: "day", label: "The day" },
  { id: "seasons", label: "Seasons" },
  { id: "year", label: "The year" },
  { id: "neighbourhoods", label: "Neighbourhoods" },
  { id: "health", label: "Your health" },
  { id: "plan", label: "Plan your day" },
  { id: "method", label: "Method" },
];

/** Reading-progress bar plus a dot nav on wide screens. */
export function ChapterNav() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const c of CHAPTERS) {
      const el = document.getElementById(c.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <motion.div
        className="fixed inset-x-0 top-0 z-40 h-0.5 origin-left bg-heat"
        style={{ scaleX }}
        aria-hidden
      />
      <nav
        aria-label="Chapters"
        className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
      >
        <ol className="space-y-3">
          {CHAPTERS.map((c) => {
            const on = c.id === active;
            return (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  aria-current={on ? "location" : undefined}
                  className="group flex items-center justify-end gap-3 rounded focus-visible:outline-2 focus-visible:outline-ink"
                >
                  <span
                    className={`text-xs transition-opacity ${on ? "text-ink opacity-100" : "text-mute opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}
                  >
                    {c.label}
                  </span>
                  <span
                    className={`block rounded-full transition-all ${on ? "size-2.5 bg-heat" : "size-1.5 bg-mute/60 group-hover:bg-ink"}`}
                    aria-hidden
                  />
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
