"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { SegmentedControl } from "@/components/charts/SegmentedControl";
import { aqiCategory, aqiToPm25, AQI_ADVICE } from "@/lib/aqi";
import { aqiCeiling, HOURS, monthsData, trafficData } from "@/lib/data";
import { hourLabel } from "@/lib/format";
import { useDhakaNow } from "@/lib/hooks";
import { findWindows, mean, type Window } from "@/lib/plan";
import type { DayType } from "@/lib/types";

const STRIP_MAX = aqiCeiling(monthsData.months.flatMap((m) => m.aqi));

const RANGES = {
  waking: { label: "5 am – 11 pm", from: 5, to: 23 },
  daylight: { label: "Daylight, 6 am – 6 pm", from: 6, to: 18 },
} as const;
type RangeId = keyof typeof RANGES;

export function Planner() {
  const reduce = useReducedMotion();
  const now = useDhakaNow();
  const ids = { month: useId(), duration: useId() };

  // Until the user picks a month, follow the current Dhaka month (January before hydration).
  const [pickedMonth, setPickedMonth] = useState<number | null>(null);
  const month = pickedMonth ?? now?.month ?? 0;
  const [day, setDay] = useState<DayType>("weekday");
  const [duration, setDuration] = useState(2);
  const [range, setRange] = useState<RangeId>("waking");

  const row = monthsData.months[month];
  const traffic = trafficData.days[day].map((p) => p.median);
  const { from, to } = RANGES[range];
  const { best, worst } = findWindows(row.aqi, duration, from, to);
  const pm = (w: Window) => mean(row.aqi.slice(w.start, w.end).map(aqiToPm25));
  const saved = Math.round((1 - pm(best) / pm(worst)) * 100);
  const bestCat = aqiCategory(best.mean);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
      <form
        className="space-y-6 rounded-2xl border border-line bg-panel p-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <label
            htmlFor={ids.month}
            className="text-xs font-semibold uppercase tracking-[0.15em] text-mute"
          >
            Month
          </label>
          <select
            id={ids.month}
            value={month}
            onChange={(e) => setPickedMonth(Number(e.target.value))}
            className="mt-2 block w-full rounded-lg border border-line-strong bg-bg px-3 py-2.5 text-ink focus-visible:outline-2 focus-visible:outline-ink"
          >
            {monthsData.months.map((m) => (
              <option key={m.month} value={m.month}>
                {m.label}
                {now?.month === m.month ? " (this month)" : ""}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-[0.15em] text-mute">
            Day
          </legend>
          <div className="mt-2">
            <SegmentedControl
              label="Day type"
              value={day}
              onChange={setDay}
              options={[
                { value: "weekday", label: "Weekday" },
                { value: "friday", label: "Friday" },
              ]}
            />
          </div>
        </fieldset>

        <div>
          <label
            htmlFor={ids.duration}
            className="flex justify-between text-xs font-semibold uppercase tracking-[0.15em] text-mute"
          >
            Time outside <span className="tabular-nums text-ink">{duration} h</span>
          </label>
          <input
            id={ids.duration}
            type="range"
            min={1}
            max={4}
            step={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--color-heat)]"
          />
        </div>

        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-[0.15em] text-mute">
            Search within
          </legend>
          <div className="mt-2">
            <SegmentedControl
              label="Hours to search"
              value={range}
              onChange={setRange}
              options={(Object.keys(RANGES) as RangeId[]).map((k) => ({
                value: k,
                label: RANGES[k].label,
              }))}
            />
          </div>
        </fieldset>
      </form>

      <div aria-live="polite">
        <div className="grid gap-4 sm:grid-cols-2">
          <WindowCard tone="best" w={best} pm25={pm(best)} temp={row.temp} traffic={traffic} />
          <WindowCard tone="worst" w={worst} pm25={pm(worst)} temp={row.temp} traffic={traffic} />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink/80">
          Going out at{" "}
          <strong className="text-ink">
            {hourLabel(best.start, "long")} instead of {hourLabel(worst.start, "long")}
          </strong>{" "}
          cuts the fine particles you breathe by about{" "}
          <strong className="text-ink">{saved}%</strong>. {AQI_ADVICE[bestCat.name]}
        </p>

        {/* 24h strip: each bar is one hour, the windows are outlined. */}
        <div className="mt-6" aria-hidden>
          <div className="relative grid h-24 grid-cols-24 items-end gap-[2px]">
            {HOURS.map((h) => {
              const v = row.aqi[h];
              const inRange = h >= from && h < to;
              return (
                <motion.div
                  key={h}
                  className="rounded-t-[2px]"
                  style={{ backgroundColor: aqiCategory(v).color, opacity: inRange ? 0.9 : 0.25 }}
                  initial={false}
                  animate={{ height: `${Math.min(100, (v / STRIP_MAX) * 100)}%` }}
                  transition={reduce ? { duration: 0 } : { duration: 0.45 }}
                />
              );
            })}
            <WindowOutline w={best} className="border-emerald-300" reduce={!!reduce} />
            <WindowOutline w={worst} className="border-rose-400" reduce={!!reduce} />
          </div>
          <div className="mt-1 grid grid-cols-24 text-[10px] text-mute">
            {HOURS.map((h) => (
              <span key={h} className="whitespace-nowrap">
                {h % 6 === 0 ? hourLabel(h) : ""}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-mute">
          Typical {row.label} {day === "friday" ? "Friday" : "weekday"}
          {monthsData.meta.demo ? " (demo data)" : ""}. Traffic is an estimated index that changes
          with the day type. Air quality is a typical day for the month across all days of the week,
          so the cleanest window only changes with the month.
        </p>
      </div>
    </div>
  );
}

function WindowOutline({
  w,
  className,
  reduce,
}: {
  w: Window;
  className: string;
  reduce: boolean;
}) {
  return (
    <motion.div
      className={`pointer-events-none absolute inset-y-[-4px] rounded border-2 ${className}`}
      initial={false}
      animate={{ left: `${(w.start / 24) * 100}%`, width: `${((w.end - w.start) / 24) * 100}%` }}
      transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

function WindowCard({
  tone,
  w,
  pm25,
  temp,
  traffic,
}: {
  tone: "best" | "worst";
  w: Window;
  pm25: number;
  temp: number[];
  traffic: number[];
}) {
  const c = aqiCategory(w.mean);
  const temps = temp.slice(w.start, w.end);
  const trafficMean = Math.round(mean(traffic.slice(w.start, w.end)));
  const lo = Math.min(...temps).toFixed(0);
  const hi = Math.max(...temps).toFixed(0);
  const tempRange = lo === hi ? lo : `${lo}–${hi}`;
  return (
    <div
      className={`rounded-2xl border p-5 ${tone === "best" ? "border-emerald-300/40 bg-emerald-300/5" : "border-rose-400/40 bg-rose-400/5"}`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-[0.15em] ${tone === "best" ? "text-emerald-300" : "text-rose-400"}`}
      >
        {tone === "best" ? "Cleanest window" : "Worst window"}
      </p>
      <p className="mt-2 font-display text-2xl text-ink">
        {hourLabel(w.start, "long")} – {hourLabel(w.end, "long")}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-mute">Avg AQI</dt>
        <dd className="text-right tabular-nums" style={{ color: c.display }}>
          {Math.round(w.mean)} · {c.short}
        </dd>
        <dt className="text-mute">PM2.5</dt>
        <dd className="text-right tabular-nums text-ink">{Math.round(pm25)} µg/m³</dd>
        <dt className="text-mute">Temperature</dt>
        <dd className="text-right tabular-nums text-ink">{tempRange}°C</dd>
        <dt className="text-mute">Traffic</dt>
        <dd className="text-right tabular-nums text-ink">{trafficMean}/100</dd>
      </dl>
    </div>
  );
}
