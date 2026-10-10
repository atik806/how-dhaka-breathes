"use client";

import { motion, useReducedMotion } from "motion/react";
import { aqiCategory, AQI_CATEGORIES, UNHEALTHY_THRESHOLD } from "@/lib/aqi";
import { aqiData, HOURS, SEASONS } from "@/lib/data";
import { hourLabel } from "@/lib/format";

/** 4 seasons × 24 hours, each cell colored by its EPA AQI category. */
export function HourGrid() {
  const reduce = useReducedMotion();

  return (
    <figure>
      <figcaption className="sr-only">
        Each season’s typical day as 24 hourly cells, colored by AQI category.
      </figcaption>
      {/* Phones: label + count on one line, the 24 cells full-width below. */}
      <div
        className="grid grid-cols-[1fr_auto] items-end gap-x-3 pb-2 text-[11px] text-mute sm:grid-cols-[7.5rem_1fr_4.5rem]"
        aria-hidden
      >
        <span className="hidden sm:block" />
        <div className="col-span-2 grid grid-cols-24 gap-[3px] sm:col-span-1">
          {HOURS.map((h) => (
            <span key={h} className="whitespace-nowrap tabular-nums">
              {h % 6 === 0 ? hourLabel(h) : ""}
            </span>
          ))}
        </div>
        <span className="hidden text-right sm:block">unhealthy</span>
      </div>

      {SEASONS.map((s, row) => {
        const series = aqiData.seasons[s.id];
        const bad = series.filter((p) => p.median > UNHEALTHY_THRESHOLD).length;
        return (
          <div
            key={s.id}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 py-2 sm:grid-cols-[7.5rem_1fr_4.5rem] sm:py-1.5"
          >
            <div>
              <div className="text-sm font-medium text-ink">{s.label}</div>
              <div className="text-xs text-mute">{s.months}</div>
            </div>
            <ol
              className="order-last col-span-2 grid grid-cols-24 gap-[3px] sm:order-none sm:col-span-1"
              aria-label={`${s.label}, hourly AQI`}
            >
              {series.map((p) => {
                const c = aqiCategory(p.median);
                return (
                  <motion.li
                    key={p.hour}
                    title={`${s.label}, ${hourLabel(p.hour, "long")}: AQI ${p.median} (${c.name})`}
                    aria-label={`${hourLabel(p.hour, "long")}: AQI ${p.median}, ${c.name}`}
                    className="aspect-square rounded-[3px]"
                    style={{ backgroundColor: c.color }}
                    initial={reduce ? false : { opacity: 0, scale: 0.4 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-10% 0px" }}
                    transition={{ duration: 0.35, delay: row * 0.12 + p.hour * 0.02 }}
                  />
                );
              })}
            </ol>
            <div className="text-right tabular-nums">
              <span className="font-display text-2xl text-ink">{bad}</span>
              <span className="text-xs text-mute">
                {" "}
                / 24 h<span className="sm:hidden"> unhealthy</span>
              </span>
            </div>
          </div>
        );
      })}

      <ul
        className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-mute"
        aria-label="AQI categories"
      >
        {AQI_CATEGORIES.map((c) => (
          <li key={c.name} className="flex items-center gap-2">
            <span
              className="size-3 rounded-[3px]"
              style={{ backgroundColor: c.color }}
              aria-hidden
            />
            {c.name}{" "}
            <span className="tabular-nums">
              ({c.min}–{c.max})
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
