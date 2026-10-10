"use client";

import { aqiCategory, aqiToPm25, AQI_ADVICE } from "@/lib/aqi";
import { monthsData } from "@/lib/data";
import { hourLabel } from "@/lib/format";
import { useDhakaNow } from "@/lib/hooks";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "Right now in Dhaka": the typical air for the current Dhaka month and hour. */
export function NowCard() {
  const now = useDhakaNow();

  // Same footprint before hydration so nothing jumps.
  if (!now) {
    return (
      <div
        className="h-[184px] w-full max-w-sm rounded-2xl border border-line bg-panel/70"
        aria-hidden
      />
    );
  }

  const row = monthsData.months[now.month];
  const aqi = row.aqi[now.hour];
  const temp = row.temp[now.hour];
  const c = aqiCategory(aqi);
  const time = `${now.hour % 12 === 0 ? 12 : now.hour % 12}:${String(now.minute).padStart(2, "0")} ${now.hour < 12 ? "am" : "pm"}`;

  return (
    <aside
      aria-label="Typical air in Dhaka right now"
      className="w-full max-w-sm rounded-2xl border border-line bg-panel/80 p-5 backdrop-blur"
    >
      <p className="flex items-center gap-2 text-xs text-mute">
        <span className="relative flex size-2" aria-hidden>
          <span
            className="absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none"
            style={{ backgroundColor: c.display }}
          />
          <span
            className="relative inline-flex size-2 rounded-full"
            style={{ backgroundColor: c.display }}
          />
        </span>
        Right now in Dhaka · {time}, {MONTH_NAMES[now.month]}
      </p>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="font-display text-5xl tabular-nums" style={{ color: c.display }}>
          {aqi}
        </span>
        <span className="text-sm text-ink">
          {c.name}
          <span className="block text-xs text-mute">
            ≈ {Math.round(aqiToPm25(aqi))} µg/m³ PM2.5 · {temp.toFixed(0)}°C
          </span>
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink/75">{AQI_ADVICE[c.name]}</p>
      <p className="mt-2 text-[11px] text-mute">
        Typical {hourLabel(now.hour, "long")} in {MONTH_NAMES[now.month]} (demo data, not a live
        reading).
      </p>
    </aside>
  );
}
