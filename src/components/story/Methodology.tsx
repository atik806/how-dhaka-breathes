import {
  ALL_DEMO,
  aqiData,
  monthsData,
  neighbourhoodData,
  periodLabel,
  temperatureData,
  trafficData,
} from "@/lib/data";
import { hourLabel } from "@/lib/format";
import type { DatasetMeta } from "@/lib/types";

type Kind = "measured" | "modelled" | "estimated" | "demo";

const KIND_STYLE: Record<Kind, string> = {
  measured: "border-emerald-300/50 text-emerald-300",
  modelled: "border-traffic/50 text-traffic",
  estimated: "border-heat/50 text-heat",
  demo: "border-mute/50 text-mute",
};

function kindOf(meta: DatasetMeta, fallback: Kind): Kind {
  return meta.demo ? (fallback === "estimated" ? "estimated" : "demo") : fallback;
}

const cityKind: Kind = aqiData.meta.citySource === "model" ? "modelled" : "measured";

const DATASETS: { name: string; meta: DatasetMeta; kind: Kind }[] = [
  {
    name: "Air quality, citywide",
    meta: aqiData.meta,
    kind: kindOf(aqiData.meta, cityKind),
  },
  {
    name: "Air quality by month",
    meta: monthsData.meta,
    kind: kindOf(monthsData.meta, cityKind),
  },
  {
    name: "Neighbourhoods",
    meta: neighbourhoodData.meta,
    kind: kindOf(neighbourhoodData.meta, "measured"),
  },
  {
    name: "Temperature",
    meta: temperatureData.meta,
    kind: kindOf(temperatureData.meta, "modelled"),
  },
  { name: "Traffic", meta: trafficData.meta, kind: "estimated" },
];

export function Methodology() {
  const check = aqiData.meta.validation;

  return (
    <section
      id="method"
      aria-labelledby="method-title"
      className="mx-auto max-w-6xl scroll-mt-8 border-t border-line px-5 py-24 sm:px-8"
    >
      <h2 id="method-title" className="font-display text-3xl text-ink">
        Methodology &amp; sources
      </h2>

      {ALL_DEMO ? (
        <div className="mt-6 rounded-xl border border-heat/40 bg-heat/10 p-5 text-sm leading-relaxed text-ink">
          <strong>This version uses demo data.</strong> Every number on this page is synthetic. Run{" "}
          <code className="rounded bg-panel px-1.5 py-0.5 text-xs">npm run data:real</code> to
          replace it with measured data.
        </div>
      ) : (
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink/80">
          Citywide air quality on this page is <strong className="text-ink">{cityKind}</strong>,
          neighbourhood air quality is measured by community sensors, temperature comes from a
          weather <strong className="text-ink">model</strong>, and traffic is an{" "}
          <strong className="text-ink">estimate</strong>, because Dhaka has no open hourly traffic
          data. Each dataset is labelled below.
        </p>
      )}

      <dl className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DATASETS.map((d) => (
          <div key={d.name} className="rounded-xl border border-line bg-panel p-5 text-sm">
            <dt className="flex items-start justify-between gap-3">
              <span className="font-medium text-ink">{d.name}</span>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${KIND_STYLE[d.kind]}`}
              >
                {d.kind}
              </span>
            </dt>
            <dd className="mt-1 text-xs text-mute">
              {d.meta.metric}
              {d.meta.period && ` · ${periodLabel(d.meta.period)}`}
            </dd>
            <dd className="mt-3 text-xs leading-relaxed text-ink/90">{d.meta.source}</dd>
            <dd className="mt-2 text-xs leading-relaxed text-mute">{d.meta.method}.</dd>
          </div>
        ))}
      </dl>

      {check && (
        <div className="mt-8 max-w-3xl rounded-xl border border-line bg-panel p-5 text-sm leading-relaxed">
          <h3 className="font-medium text-ink">
            {cityKind === "measured"
              ? "Why we don’t use a model for air quality"
              : "How the model compares with a real monitor"}
          </h3>
          <p className="mt-2 text-ink/80">
            Free air-quality models cover the whole world, so we compared one (Open-Meteo / CAMS)
            with the US Embassy&rsquo;s reference monitor over {check.hours.toLocaleString("en-US")}{" "}
            matching hours ({periodLabel(check.period)}). The model averaged{" "}
            <strong className="text-ink">{check.modelMeanPm25} µg/m³</strong> of PM2.5 against{" "}
            <strong className="text-ink">{check.measuredMeanPm25} µg/m³</strong> measured,{" "}
            {Math.abs(Math.round(check.bias * 100))}% {check.bias < 0 ? "too low" : "too high"}. It
            also put the daily peak at {hourLabel(check.modelPeakHour, "long")} instead of{" "}
            {hourLabel(check.measuredPeakHour, "long")} (hourly correlation {check.correlation}).
            For a story about the hour-by-hour rhythm, that isn&rsquo;t close enough
            {cityKind === "measured"
              ? ", so the citywide charts use the monitor itself."
              : ". Treat the citywide figures on this page as underestimates."}
          </p>
        </div>
      )}

      <ul className="mt-8 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink/80">
        <li>
          All hours are local Dhaka time ({aqiData.meta.timezone}, UTC+6). Each line is the median
          of a &ldquo;typical day&rdquo;, and the shaded band covers the 25th to 75th percentile of
          days.
        </li>
        <li>
          Seasons: winter Dec–Feb, pre-monsoon Mar–May, monsoon Jun–Sep, post-monsoon Oct–Nov.
        </li>
        <li>
          Officially, the US EPA AQI for PM2.5 is based on a 24-hour average. Here each hour&rsquo;s
          PM2.5 is converted with the same 2024 EPA breakpoints to show the daily rhythm, so a
          single hour can read higher or lower than the official daily AQI.
        </li>
        {!ALL_DEMO && (
          <li>
            The US Embassy monitor stopped publishing to OpenAQ in March 2025, so the citywide
            figures cover its latest full year. The neighbourhood sensors are newer (from early
            2026) and are low-cost optical sensors, which can over-read in humid air. Compare them
            with each other rather than with the citywide numbers.
          </li>
        )}
        <li>
          The cigarette comparison (22 µg/m³ of PM2.5 for a day ≈ one cigarette) is a rough rule of
          thumb from Berkeley Earth, not a clinical measure.
        </li>
        <li>
          &ldquo;Right now&rdquo; uses your device clock converted to Dhaka time and shows the
          typical value for that month and hour. It is not a live reading.
        </li>
        <li>
          Traffic and air quality overlap in time, but that alone doesn&rsquo;t show that traffic
          causes the smog. Brick kilns, construction dust, industry and the weather all contribute.
        </li>
      </ul>

      {!ALL_DEMO && (
        <p className="mt-8 text-xs text-mute">
          Data: US Embassy Dhaka via AirNow and{" "}
          <a className="underline underline-offset-2 hover:text-ink" href="https://openaq.org">
            OpenAQ
          </a>
          , Smart Air Bangladesh / AirGradient sensors, and{" "}
          <a className="underline underline-offset-2 hover:text-ink" href="https://open-meteo.com">
            Open-Meteo
          </a>{" "}
          (CC BY 4.0). Generated {aqiData.meta.generatedAt}.
        </p>
      )}
    </section>
  );
}
