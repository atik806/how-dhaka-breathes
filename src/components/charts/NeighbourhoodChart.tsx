"use client";

import { scaleLinear } from "d3-scale";
import { curveMonotoneX, line } from "d3-shape";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { aqiCategory, DARK_TEXT_CATEGORIES } from "@/lib/aqi";
import { NEIGHBOURHOOD_SEASONS, neighbourhoodData, neighbourhoodSeries, SEASONS } from "@/lib/data";
import { hourLabel } from "@/lib/format";
import { mean } from "@/lib/plan";
import type { Season } from "@/lib/types";
import { DataTable } from "./DataTable";
import { SegmentedControl } from "./SegmentedControl";

const MAX = 300;
const SPARK_W = 120;
const SPARK_H = 28;
const sx = scaleLinear()
  .domain([0, 23])
  .range([1, SPARK_W - 1]);
const SEASON_LABEL = Object.fromEntries(SEASONS.map((s) => [s.id, s.label])) as Record<
  Season,
  string
>;
// Text on the bright EPA swatches (green → orange) reads best in black.
export function NeighbourhoodChart() {
  const reduce = useReducedMotion();
  const [season, setSeason] = useState<Season>(NEIGHBOURHOOD_SEASONS[0]?.id ?? "winter");
  const demo = neighbourhoodData.meta.demo;

  // Only areas with enough data for this season are shown.
  const rows = neighbourhoodData.areas
    .flatMap((a) => {
      const series = neighbourhoodSeries(a, season);
      if (!series) return [];
      const peak = series.indexOf(Math.max(...series));
      return [
        {
          ...a,
          series,
          days: a.seasons[season]!.days,
          avg: Math.round(mean(series)),
          peak,
        },
      ];
    })
    .sort((a, b) => a.avg - b.avg);
  const missing = neighbourhoodData.areas.filter((a) => !a.seasons[season]).map((a) => a.name);
  const refMean = mean(rows.map((r) => r.avg));

  if (rows.length === 0) {
    return <p className="text-sm text-mute">Not enough neighbourhood data yet.</p>;
  }

  // Sparklines share one y-scale per season so their shapes stay comparable.
  const all = rows.flatMap((r) => r.series);
  const sy = scaleLinear()
    .domain([Math.min(...all), Math.max(...all)])
    .range([SPARK_H - 2, 2]);
  const spark = line<number>()
    .x((_, i) => sx(i))
    .y((v) => sy(v))
    .curve(curveMonotoneX);

  const t = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 32 };

  return (
    <div>
      <SegmentedControl
        label="Season"
        value={season}
        onChange={setSeason}
        options={NEIGHBOURHOOD_SEASONS.map((s) => ({
          value: s.id,
          label: s.label,
        }))}
      />

      <div className="relative mt-8">
        {/* Average-of-areas reference line, positioned over the bar column. */}
        <div
          className="pointer-events-none absolute inset-y-0 left-[8.5rem] right-0 sm:left-[12.5rem] sm:right-[9.5rem]"
          aria-hidden
        >
          <motion.div
            className="absolute inset-y-0 border-l border-dashed border-ink/40"
            initial={false}
            animate={{ left: `${(refMean / MAX) * 100}%` }}
            transition={t}
          >
            <span className="absolute -top-5 -translate-x-1/2 whitespace-nowrap text-[10px] text-mute">
              avg {Math.round(refMean)}
            </span>
          </motion.div>
        </div>

        <ol
          className="space-y-2"
          aria-label={`Neighbourhoods ranked by daily average AQI, cleanest first`}
        >
          {rows.map((r) => {
            const c = aqiCategory(r.avg);
            return (
              <motion.li
                key={r.id}
                layout={!reduce}
                transition={t}
                className="grid grid-cols-[8rem_1fr] items-center gap-x-2 sm:grid-cols-[12rem_1fr_9rem]"
              >
                <div className="pr-2">
                  <div className="text-sm font-medium text-ink">{r.name}</div>
                  <div
                    className="truncate text-[11px] text-mute sm:whitespace-normal"
                    title={r.site}
                  >
                    {r.site}
                    {!demo && ` · ${r.days} days`}
                  </div>
                </div>
                <div className="relative h-7 rounded bg-line/40">
                  <motion.div
                    className="absolute inset-y-0 left-0 flex items-center justify-end rounded pr-2"
                    style={{ backgroundColor: c.color }}
                    initial={false}
                    animate={{
                      width: `${(Math.min(r.avg, MAX) / MAX) * 100}%`,
                    }}
                    transition={t}
                  >
                    <span
                      className={`text-xs font-semibold tabular-nums ${DARK_TEXT_CATEGORIES.has(c.name) ? "text-black/80" : "text-white"}`}
                    >
                      {r.avg}
                    </span>
                  </motion.div>
                </div>
                <div className="hidden items-center justify-end sm:flex" aria-hidden>
                  <svg width={SPARK_W} height={SPARK_H}>
                    <path
                      d={spark(r.series) ?? ""}
                      fill="none"
                      stroke={c.display}
                      strokeWidth={1.5}
                    />
                    <circle cx={sx(r.peak)} cy={sy(r.series[r.peak])} r={2.5} fill={c.display} />
                  </svg>
                </div>
                <p className="sr-only">
                  {r.name}: daily average AQI {r.avg}, {c.name}; worst at{" "}
                  {hourLabel(r.peak, "long")}.
                </p>
              </motion.li>
            );
          })}
        </ol>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-[11px] text-mute">
          <span>
            {missing.length > 0 &&
              `Not enough ${SEASON_LABEL[season].toLowerCase()} data: ${missing.join(", ")}.`}
          </span>
          <span className="hidden sm:inline">24h curve · dot = worst hour</span>
        </div>
      </div>

      <DataTable
        caption={`Typical hourly AQI by neighbourhood, ${SEASON_LABEL[season]}`}
        columns={rows.map((r) => ({
          label: r.name,
          series: r.series.map((v, hour) => ({
            hour,
            median: v,
            p25: v,
            p75: v,
          })),
        }))}
      />
    </div>
  );
}
