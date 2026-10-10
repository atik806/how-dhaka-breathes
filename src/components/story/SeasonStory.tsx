"use client";

import { useState } from "react";
import { DataTable } from "@/components/charts/DataTable";
import { SeasonChart } from "@/components/charts/SeasonChart";
import { SegmentedControl } from "@/components/charts/SegmentedControl";
import { aqiCategory } from "@/lib/aqi";
import { aqiData, SEASONS } from "@/lib/data";
import { hourLabel } from "@/lib/format";
import { seasonStats } from "@/lib/story";
import type { Season } from "@/lib/types";

const winter = seasonStats("winter");
const monsoon = seasonStats("monsoon");

export function SeasonStory() {
  const [selected, setSelected] = useState<Season>("winter");
  const stats = seasonStats(selected);
  const meta = SEASONS.find((s) => s.id === selected)!;

  const tiles = [
    { label: "Daily average", value: stats.mean, sub: aqiCategory(stats.mean).name },
    { label: "Worst hour", value: stats.worst.median, sub: hourLabel(stats.worst.hour, "long") },
    {
      label: "Cleanest hour",
      value: stats.cleanest.median,
      sub: hourLabel(stats.cleanest.hour, "long"),
    },
    { label: "Unhealthy hours", value: stats.unhealthyHours, sub: "AQI above 150" },
  ];

  return (
    <section
      id="seasons"
      aria-labelledby="seasons-title"
      className="mx-auto max-w-6xl scroll-mt-8 px-5 py-28 sm:px-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-heat">Part two</p>
      <h2 id="seasons-title" className="mt-3 max-w-3xl font-display text-4xl text-ink sm:text-5xl">
        Same city, different air
      </h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">
        The daily rhythm hardly changes through the year, but its height does. A winter day averages
        an AQI of {winter.mean}. Once the monsoon rains arrive, that drops to {monsoon.mean}, about{" "}
        {Math.round(winter.mean / monsoon.mean)} times cleaner. Rain washes particles out of the
        air, and the brick kilns, which can only fire in the dry season, go cold.
      </p>

      <div className="mt-10">
        <SegmentedControl
          label="Season"
          value={selected}
          onChange={setSelected}
          options={SEASONS.map((s) => ({ value: s.id, label: s.label }))}
        />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <figure className="h-[360px] sm:h-[420px]">
          <figcaption className="sr-only">
            Typical daily AQI curve for each season. {meta.label} is highlighted.
          </figcaption>
          <SeasonChart selected={selected} />
        </figure>

        <dl className="grid grid-cols-2 content-start gap-3" aria-live="polite">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-xl border border-line bg-panel p-4">
              <dt className="text-xs text-mute">{t.label}</dt>
              <dd className="mt-1 font-display text-3xl tabular-nums text-ink">{t.value}</dd>
              <dd className="text-xs text-mute">{t.sub}</dd>
            </div>
          ))}
          <p className="col-span-2 text-xs leading-relaxed text-mute">
            {meta.label} ({meta.months}). The shaded band shows the middle half of days (25th to
            75th percentile).
          </p>
        </dl>
      </div>

      <DataTable
        caption="Typical hourly AQI by season in Dhaka"
        columns={SEASONS.map((s) => ({ label: s.label, series: aqiData.seasons[s.id] }))}
      />
    </section>
  );
}
