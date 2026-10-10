"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Tracks an element's content size with ResizeObserver. */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

/**
 * Returns the index of the scroll step currently crossing the trigger line.
 * Steps are found by `[data-step]` inside the container. On narrow screens the
 * chart is pinned at the top, so the trigger line sits lower.
 */
export function useActiveStep<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
    const narrow = window.matchMedia("(max-width: 1023px)").matches;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number(entry.target.getAttribute("data-step")));
        }
      },
      { rootMargin: narrow ? "-70% 0px -25% 0px" : "-48% 0px -48% 0px" },
    );
    steps.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return [ref, active] as const;
}

// --- Live Dhaka clock ------------------------------------------------------

const dhakaParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Dhaka",
  month: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
});

function subscribeMinute(onChange: () => void) {
  const id = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(id);
}
const minuteSnapshot = () => Math.floor(Date.now() / 60_000);
const serverSnapshot = () => null;

export type DhakaNow = { month: number; hour: number; minute: number };

/** Current month/hour/minute in Asia/Dhaka; null during prerender and hydration. */
export function useDhakaNow(): DhakaNow | null {
  const minute = useSyncExternalStore(subscribeMinute, minuteSnapshot, serverSnapshot);
  if (minute === null) return null;
  const parts = Object.fromEntries(
    dhakaParts.formatToParts(new Date(minute * 60_000)).map((p) => [p.type, p.value]),
  );
  return {
    month: Number(parts.month) - 1,
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}
