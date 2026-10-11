"use client";

import { scaleLinear } from "d3-scale";
import { motion, useReducedMotion } from "motion/react";
import { aqiCeiling, aqiData, SEASONS } from "@/lib/data";
import { useSize } from "@/lib/hooks";
import type { Season } from "@/lib/types";
import { AqiBands, AqiGradient } from "./AqiGradient";
import { HourAxis } from "./HourAxis";
import { bandPath, linePath } from "./scales";

// One y-scale for every season, sized to the dirtiest band.
const Y_MAX = aqiCeiling(SEASONS.flatMap((s) => aqiData.seasons[s.id].map((p) => p.p75)));
const TICKS = Array.from({ length: Y_MAX / 50 + 1 }, (_, i) => i * 50);

const M = { top: 12, right: 92, bottom: 26, left: 38 };

export function SeasonChart({ selected }: { selected: Season }) {
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const reduce = useReducedMotion();
  const t = reduce ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

  const x = scaleLinear()
    .domain([0, 23])
    .range([M.left, Math.max(M.left + 1, width - M.right)]);
  const y = scaleLinear()
    .domain([0, Y_MAX])
    .range([height - M.bottom, M.top]);
  const series = aqiData.seasons[selected];

  return (
    <div ref={ref} className="relative h-full w-full">
      {width > 0 && height > 0 && (
        <svg width={width} height={height} className="absolute inset-0" aria-hidden>
          <defs>
            <AqiGradient id="season-aqi" y={y} />
          </defs>
          <AqiBands y={y} x0={M.left} x1={width - M.right} opacity={0.08} />
          {TICKS.map((v) => (
            <text
              key={v}
              x={M.left - 8}
              y={y(v)}
              dy="0.32em"
              textAnchor="end"
              className="fill-mute text-[10px] tabular-nums"
            >
              {v}
            </text>
          ))}

          <motion.path
            initial={false}
            animate={{ d: bandPath(series, x, y) }}
            transition={t}
            fill="var(--color-ink)"
            opacity={0.1}
          />

          {SEASONS.map((s) => {
            const data = aqiData.seasons[s.id];
            const active = s.id === selected;
            const last = data[data.length - 1];
            return (
              <g key={s.id}>
                <motion.path
                  d={linePath(data, x, y)}
                  fill="none"
                  stroke={active ? "url(#season-aqi)" : "var(--color-mute)"}
                  strokeLinecap="round"
                  initial={false}
                  animate={{ strokeWidth: active ? 3 : 1.25, opacity: active ? 1 : 0.35 }}
                  transition={t}
                />
                <motion.text
                  x={x(23) + 8}
                  y={y(last.median)}
                  dy="0.32em"
                  className="text-[11px]"
                  initial={false}
                  animate={{ opacity: active ? 1 : 0.5 }}
                  fill={active ? "var(--color-ink)" : "var(--color-mute)"}
                  fontWeight={active ? 600 : 400}
                >
                  {s.label}
                </motion.text>
              </g>
            );
          })}
          <HourAxis x={x} y={height - M.bottom + 4} />
        </svg>
      )}
    </div>
  );
}
