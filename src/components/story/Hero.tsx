"use client";

import { scaleLinear } from "d3-scale";
import { motion, useReducedMotion } from "motion/react";
import { aqiData } from "@/lib/data";
import { STORY_SEASON } from "@/lib/story";
import { AqiGradient } from "@/components/charts/AqiGradient";
import { bandPath, linePath } from "@/components/charts/scales";
import { NowCard } from "./NowCard";

const W = 960;
const H = 220;

export function Hero() {
  const reduce = useReducedMotion();
  const series = aqiData.seasons[STORY_SEASON];
  const x = scaleLinear().domain([0, 23]).range([0, W]);
  const y = scaleLinear()
    .domain([100, 300])
    .range([H - 10, 10]);

  return (
    <header className="relative flex min-h-svh flex-col justify-center overflow-hidden px-5 sm:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-10 pt-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:pt-0">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-1 text-xs text-mute">
            <span className="size-1.5 rounded-full bg-heat" aria-hidden />A data story · Dhaka,
            Bangladesh · demo data
          </p>
          <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.02] text-ink sm:text-7xl lg:text-8xl">
            How Dhaka <em className="text-heat">breathes</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80">
            Twenty million people share one sky. Hour by hour, its air quality rises and falls with
            the traffic, the sun and the season. This is what a single day looks like.
          </p>
        </div>
        <NowCard />
      </div>

      <div className="pointer-events-none mx-auto mt-14 w-full max-w-6xl" aria-hidden>
        <motion.svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full overflow-visible"
          animate={reduce ? undefined : { scaleY: [1, 1.06, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ originY: 1 }}
        >
          <defs>
            <AqiGradient id="hero-aqi" y={y} />
          </defs>
          <path d={bandPath(series, x, y)} fill="var(--color-ink)" opacity={0.06} />
          <motion.path
            d={linePath(series, x, y)}
            fill="none"
            stroke="url(#hero-aqi)"
            strokeWidth={3}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </motion.svg>
        <div className="mt-2 flex justify-between text-[11px] text-mute">
          <span>midnight</span>
          <span>noon</span>
          <span>11 pm</span>
        </div>
      </div>

      <a
        href="#day"
        className="mx-auto mt-12 flex flex-col items-center gap-2 text-xs uppercase tracking-[0.2em] text-mute hover:text-ink"
      >
        Start the day
        <motion.span
          aria-hidden
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          ↓
        </motion.span>
      </a>
    </header>
  );
}
