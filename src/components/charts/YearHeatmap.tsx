"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState, type KeyboardEvent } from "react";
import { aqiCategory, aqiToPm25 } from "@/lib/aqi";
import { HOURS, monthsData } from "@/lib/data";
import { hourLabel } from "@/lib/format";
import { useDhakaNow } from "@/lib/hooks";
import { mean } from "@/lib/plan";

const rows = monthsData.months;
const worstMonth = rows.reduce((a, b) => (mean(b.aqi) > mean(a.aqi) ? b : a));

/** 12 months × 24 hours of typical AQI. Hover, or focus and use the arrow keys, to read a cell. */
export function YearHeatmap() {
  const reduce = useReducedMotion();
  const now = useDhakaNow();
  const [cell, setCell] = useState({ m: worstMonth.month, h: 8 });
  const row = rows[cell.m];
  const aqi = row.aqi[cell.h];
  const c = aqiCategory(aqi);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const d: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const move = d[e.key];
    if (!move) return;
    e.preventDefault();
    setCell(({ m, h }) => ({ m: (m + move[0] + 12) % 12, h: (h + move[1] + 24) % 24 }));
  }

  return (
    <figure>
      <figcaption className="sr-only">
        A grid of typical air quality for every hour of every month. Rows are months, columns are
        hours, and the color is the AQI category.
      </figcaption>

      <div
        className="mb-4 flex min-h-14 flex-wrap items-baseline gap-x-4 gap-y-1"
        aria-live="polite"
        aria-atomic
      >
        <span className="font-display text-3xl text-ink">
          {row.label}, {hourLabel(cell.h, "long")}
        </span>
        <span className="text-sm text-mute">
          AQI{" "}
          <strong className="tabular-nums" style={{ color: c.display }}>
            {aqi}
          </strong>{" "}
          · {c.name} · ≈ {Math.round(aqiToPm25(aqi))} µg/m³ · {row.temp[cell.h].toFixed(1)}°C
        </span>
      </div>

      <div
        tabIndex={0}
        role="group"
        aria-label="Year heatmap. Use the arrow keys to move between months and hours."
        onKeyDown={onKeyDown}
        className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ink/60"
      >
        <div
          className="grid grid-cols-[2.25rem_1fr_3rem] gap-x-2 pb-1 text-[10px] text-mute sm:grid-cols-[2.75rem_1fr_4rem] sm:text-[11px]"
          aria-hidden
        >
          <span />
          <div className="grid grid-cols-24">
            {HOURS.map((h) => (
              <span key={h} className="whitespace-nowrap">
                {h % 6 === 0 ? hourLabel(h) : ""}
              </span>
            ))}
          </div>
          <span className="text-right">avg</span>
        </div>

        {rows.map((r) => {
          const avg = Math.round(mean(r.aqi));
          return (
            <div
              key={r.month}
              className="grid grid-cols-[2.25rem_1fr_3rem] items-center gap-x-2 sm:grid-cols-[2.75rem_1fr_4rem]"
            >
              <span className={`text-xs ${r.month === cell.m ? "text-ink" : "text-mute"}`}>
                {r.label}
              </span>
              <div className="grid grid-cols-24 gap-px py-px">
                {r.aqi.map((v, h) => {
                  const selected = r.month === cell.m && h === cell.h;
                  const isNow = now?.month === r.month && now.hour === h;
                  return (
                    <motion.div
                      key={h}
                      onPointerEnter={() => setCell({ m: r.month, h })}
                      title={`${r.label} ${hourLabel(h, "long")}: AQI ${v}`}
                      className={`relative h-4 sm:h-6 ${h === 0 ? "rounded-l-sm" : ""} ${h === 23 ? "rounded-r-sm" : ""}`}
                      style={{ backgroundColor: aqiCategory(v).color }}
                      initial={reduce ? false : { opacity: 0 }}
                      whileInView={{ opacity: selected ? 1 : 0.82 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: reduce ? 0 : r.month * 0.04 + h * 0.008 }}
                    >
                      {(selected || isNow) && (
                        <span
                          className={`absolute -inset-0.5 z-10 rounded-sm ring-2 ${selected ? "ring-ink" : "ring-ink/50 ring-offset-0"}`}
                          aria-hidden
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <span
                className="text-right text-xs tabular-nums"
                style={{ color: aqiCategory(avg).display }}
              >
                {avg}
              </span>
            </div>
          );
        })}
      </div>

      {now && (
        <p className="mt-3 flex items-center gap-2 text-xs text-mute">
          <span className="inline-block size-3 rounded-sm ring-2 ring-ink/50" aria-hidden /> the
          outlined cell is right now in Dhaka ({rows[now.month].label},{" "}
          {hourLabel(now.hour, "long")})
        </p>
      )}
    </figure>
  );
}
