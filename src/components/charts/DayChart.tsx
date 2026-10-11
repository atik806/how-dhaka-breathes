"use client";

import { scaleLinear } from "d3-scale";
import { motion, useReducedMotion } from "motion/react";
import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { aqiCategory } from "@/lib/aqi";
import { aqiCeiling, aqiData, temperatureData, trafficData } from "@/lib/data";
import { hourLabel } from "@/lib/format";
import { useSize } from "@/lib/hooks";
import { STORY_SEASON, type StoryStep } from "@/lib/story";
import type { Layer, Series } from "@/lib/types";
import { AqiBands, AqiGradient } from "./AqiGradient";
import { HourAxis } from "./HourAxis";
import { bandPath, linePath, niceDomain } from "./scales";

type Panel = {
  layer: Layer;
  title: string;
  unit: string;
  color: string;
  series: Series;
  weight: number;
  domainStep: number;
  ticks: (d: [number, number]) => number[];
  digits: number;
};

const PANELS: Panel[] = [
  {
    layer: "aqi",
    title: "Air quality",
    unit: "US AQI",
    color: "url(#day-aqi)",
    series: aqiData.seasons[STORY_SEASON],
    weight: 0.44,
    domainStep: 50,
    ticks: ([lo, hi]) => [lo, (lo + hi) / 2, hi],
    digits: 0,
  },
  {
    layer: "traffic",
    title: "Traffic",
    unit: "congestion index · estimated",
    color: "var(--color-traffic)",
    series: trafficData.days.weekday,
    weight: 0.28,
    domainStep: 50,
    ticks: () => [0, 50, 100],
    digits: 0,
  },
  {
    layer: "temp",
    title: "Temperature",
    unit: "°C",
    color: "var(--color-heat)",
    series: temperatureData.seasons[STORY_SEASON],
    weight: 0.28,
    domainStep: 5,
    ticks: ([lo, hi]) => [lo, hi],
    digits: 1,
  },
];

const M = { top: 6, right: 14, bottom: 26, left: 38 };
const GAP = 14;
const HEADER = 20;

export function DayChart({ step, stepIndex }: { step: StoryStep; stepIndex: number }) {
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const reduce = useReducedMotion();
  // A user-picked hour only applies to the step it was picked in.
  const [picked, setPicked] = useState<{ step: number; hour: number } | null>(null);
  const hour = picked?.step === stepIndex ? picked.hour : step.focusHour;
  const pick = (h: number) => setPicked({ step: stepIndex, hour: Math.max(0, Math.min(23, h)) });

  const ready = width > 0 && height > 0;
  const x = scaleLinear()
    .domain([0, 23])
    .range([M.left, Math.max(M.left + 1, width - M.right)]);
  const plotH = Math.max(0, height - M.top - M.bottom - GAP * (PANELS.length - 1));

  const plotBottom = M.top + plotH + GAP * (PANELS.length - 1);
  const layout = PANELS.map((p, i) => {
    const h = plotH * p.weight;
    const before = PANELS.slice(0, i).reduce((sum, q) => sum + q.weight, 0);
    const top = M.top + plotH * before + GAP * i;
    const domain =
      p.layer === "aqi"
        ? ([0, aqiCeiling(p.series.map((q) => q.p75))] as [number, number])
        : niceDomain([p.series], p.domainStep);
    const y = scaleLinear()
      .domain(domain)
      .range([top + h, top + HEADER]);
    return { ...p, top, h, y, domain, visible: step.layers.includes(p.layer) };
  });

  const t = (duration: number, delay = 0) =>
    reduce ? { duration: 0 } : { duration, delay, ease: [0.22, 1, 0.36, 1] as const };

  const valueText = layout
    .filter((p) => p.visible)
    .map((p) => {
      const v = p.series[hour].median;
      if (p.layer === "aqi") return `AQI ${v}, ${aqiCategory(v).name}`;
      if (p.layer === "traffic") return `traffic ${v} out of 100`;
      return `${v.toFixed(1)} degrees Celsius`;
    })
    .join("; ");

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    pick(Math.round(x.invert(e.clientX - rect.left)));
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowDown: -1,
      ArrowRight: 1,
      ArrowUp: 1,
    };
    if (e.key in moves) pick(hour + moves[e.key]);
    else if (e.key === "Home") pick(0);
    else if (e.key === "End") pick(23);
    else return;
    e.preventDefault();
  }

  const aqiNow = PANELS[0].series[hour].median;
  const category = aqiCategory(aqiNow);

  return (
    <figure className="flex h-full w-full flex-col">
      <figcaption className="sr-only">
        A typical winter day in Dhaka, hour by hour: air quality index, an estimated weekday traffic
        congestion index, and temperature, drawn on a shared 24-hour axis.
      </figcaption>

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 pb-3" aria-hidden>
        <span className="font-display text-3xl tabular-nums text-ink sm:text-4xl">
          {hourLabel(hour, "short")}
        </span>
        {layout.map((p) => {
          if (!p.visible) return null;
          const v = p.series[hour].median;
          return (
            <span key={p.layer} className="text-sm text-mute">
              {p.title}{" "}
              <span
                className="font-semibold tabular-nums"
                style={{ color: p.layer === "aqi" ? category.display : p.color }}
              >
                {v.toFixed(p.layer === "temp" ? 1 : 0)}
                {p.layer === "temp" ? "°" : ""}
              </span>
              {p.layer === "aqi" && <span className="ml-1.5 text-xs">{category.name}</span>}
            </span>
          );
        })}
      </div>

      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Hour of day. Use arrow keys to read each hour's values."
        aria-valuemin={0}
        aria-valuemax={23}
        aria-valuenow={hour}
        aria-valuetext={`${hourLabel(hour, "long")}: ${valueText}`}
        onKeyDown={onKeyDown}
        className="relative min-h-0 flex-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ink/60"
      >
        {ready && (
          <svg
            width={width}
            height={height}
            className="absolute inset-0 touch-pan-y"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setPicked(null)}
            aria-hidden
          >
            <defs>
              <AqiGradient id="day-aqi" y={layout[0].y} />
            </defs>

            <motion.rect
              y={M.top}
              height={plotBottom - M.top}
              rx={6}
              fill="currentColor"
              className="text-ink"
              initial={false}
              animate={{
                x: step.range ? x(step.range[0] - 0.5) : M.left,
                width: step.range ? x(step.range[1] + 0.5) - x(step.range[0] - 0.5) : 0,
                opacity: step.range ? 0.06 : 0,
              }}
              transition={t(0.6)}
            />

            {layout.map((p) => (
              <g key={p.layer}>
                {p.layer === "aqi" && <AqiBands y={p.y} x0={M.left} x1={width - M.right} />}

                <text x={M.left} y={p.top + 12} className="fill-ink text-[12px] font-medium">
                  {p.title}
                  <tspan className="fill-mute font-normal"> · {p.unit}</tspan>
                </text>

                {p.ticks(p.domain).map((v) => (
                  <g key={v}>
                    <line
                      x1={M.left}
                      x2={width - M.right}
                      y1={p.y(v)}
                      y2={p.y(v)}
                      className="stroke-line"
                      strokeDasharray="2 4"
                    />
                    <text
                      x={M.left - 8}
                      y={p.y(v)}
                      dy="0.32em"
                      textAnchor="end"
                      className="fill-mute text-[10px] tabular-nums"
                    >
                      {v}
                    </text>
                  </g>
                ))}

                <motion.path
                  d={bandPath(p.series, x, p.y)}
                  fill={p.layer === "aqi" ? "var(--color-ink)" : p.color}
                  initial={false}
                  animate={{ opacity: p.visible ? (p.layer === "aqi" ? 0.07 : 0.14) : 0 }}
                  transition={t(0.6, 0.2)}
                />
                <motion.path
                  d={linePath(p.series, x, p.y)}
                  fill="none"
                  stroke={p.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: p.visible ? 1 : 0, opacity: p.visible ? 1 : 0 }}
                  transition={t(1.1)}
                />
                {!p.visible && (
                  <text
                    x={(M.left + width - M.right) / 2}
                    y={p.top + HEADER + (p.h - HEADER) / 2}
                    textAnchor="middle"
                    className="fill-mute text-[11px] italic"
                  >
                    keep scrolling
                  </text>
                )}

                {p.visible && (
                  <motion.circle
                    r={4.5}
                    fill={p.layer === "aqi" ? category.display : p.color}
                    className="stroke-bg"
                    strokeWidth={2}
                    initial={false}
                    animate={{ cx: x(hour), cy: p.y(p.series[hour].median) }}
                    transition={t(0.35)}
                  />
                )}
              </g>
            ))}

            <motion.line
              y1={M.top}
              y2={plotBottom}
              className="stroke-ink/40"
              strokeWidth={1}
              initial={false}
              animate={{ x1: x(hour), x2: x(hour) }}
              transition={t(0.35)}
            />

            <HourAxis x={x} y={plotBottom + 4} />
          </svg>
        )}
      </div>
    </figure>
  );
}
