import { aqiData, monthsData, neighbourhoodData, temperatureData, trafficData } from "@/lib/data";

const DATASETS = [
  {
    name: "Air quality",
    meta: aqiData.meta,
    real: "Open-Meteo Air Quality API (us_aqi, pm2_5, hourly)",
  },
  {
    name: "Temperature",
    meta: temperatureData.meta,
    real: "Open-Meteo Historical Weather API (temperature_2m)",
  },
  {
    name: "Traffic",
    meta: trafficData.meta,
    real: "No open hourly feed. An estimated index from commute studies",
  },
  {
    name: "Monthly curves",
    meta: monthsData.meta,
    real: "The same Open-Meteo APIs, aggregated by calendar month",
  },
  {
    name: "Neighbourhoods",
    meta: neighbourhoodData.meta,
    real: "DoE CAMS stations, the US Embassy monitor and PurpleAir sensors",
  },
];

export function Methodology() {
  return (
    <section
      id="method"
      aria-labelledby="method-title"
      className="mx-auto max-w-6xl border-t border-line px-5 py-24 sm:px-8"
    >
      <h2 id="method-title" className="font-display text-3xl text-ink">
        Methodology &amp; sources
      </h2>

      <div className="mt-6 rounded-xl border border-heat/40 bg-heat/10 p-5 text-sm leading-relaxed text-ink">
        <strong>This version uses demo data.</strong> Every number on this page is synthetic. The
        curves are shaped to follow patterns reported for Dhaka, but they are not measurements. Do
        not cite them. To use real data, replace{" "}
        <code className="rounded bg-panel px-1.5 py-0.5 text-xs">
          scripts/generate-demo-data.mjs
        </code>{" "}
        with a fetcher that writes the same JSON shape.
      </div>

      <dl className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DATASETS.map((d) => (
          <div key={d.name} className="rounded-xl border border-line bg-panel p-5 text-sm">
            <dt className="font-medium text-ink">{d.name}</dt>
            <dd className="mt-1 text-xs text-mute">
              {d.meta.metric} · {d.meta.unit}
            </dd>
            <dd className="mt-3 leading-relaxed text-ink/80">{d.meta.method}.</dd>
            <dd className="mt-3 text-xs leading-relaxed text-mute">
              <span className="text-ink/70">Real source for production:</span> {d.real}.
            </dd>
          </div>
        ))}
      </dl>

      <ul className="mt-8 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink/80">
        <li>
          All hours are local Dhaka time ({aqiData.meta.timezone}, UTC+6). Each line is the median
          of a &ldquo;typical day&rdquo;, and the shaded band covers the 25th to 75th percentile.
        </li>
        <li>
          Seasons: winter Dec–Feb, pre-monsoon Mar–May, monsoon Jun–Sep, post-monsoon Oct–Nov. The
          day-by-day story uses winter weekdays.
        </li>
        <li>
          AQI uses the US EPA scale and categories. Model-based AQI (such as Open-Meteo/CAMS) is an
          estimate, not a reading from a ground sensor.
        </li>
        <li>
          PM2.5 values are converted back from AQI using the 2024 US EPA breakpoints. The cigarette
          comparison (22 µg/m³ for a day ≈ one cigarette) is a rough rule of thumb from Berkeley
          Earth, not a clinical measure.
        </li>
        <li>
          &ldquo;Right now&rdquo; uses your device clock converted to Dhaka time and shows the
          typical value for that month and hour. It is not a live reading.
        </li>
        <li>
          Traffic and air quality rise and fall together, but that alone doesn&rsquo;t show that
          traffic causes the smog. Brick kilns, construction dust, industry and the weather all
          contribute.
        </li>
      </ul>
    </section>
  );
}
