// Fetches REAL data for "How Dhaka Breathes" and writes the same JSON shapes
// the demo generator produces, so the site needs no code changes to switch.
//
//   City AQI        default: MEASURED hourly PM2.5 from the US Embassy Dhaka
//                   reference monitor (OpenAQ), its latest full year
//                   (Apr 2024 – Mar 2025; the feed stops on 24 Mar 2025).
//                   --source=model: Open-Meteo CAMS model, last 12 complete months.
//                   (The model reads ~48% low against the monitor, so it is a fallback.)
//   Temperature     Open-Meteo Historical Weather (ERA5), same dates as the AQI.
//   Neighbourhoods  OpenAQ v3, measured PM2.5 from low-cost sensors.
//   Model check     US Embassy monitor vs the model, stored in aqi.json meta.
//   Traffic         not fetched: no open hourly feed exists (stays estimated).
//
// Run: npm run data:real [-- --source=model]
// Reads OPENAQ_API_KEY from .env.local. Without it, only --source=model works,
// and the existing neighbourhood file is kept.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(outDir, { recursive: true });

const LAT = 23.8103;
const LON = 90.4125;
const TZ = "Asia/Dhaka";
const OPENAQ_KEY = process.env.OPENAQ_API_KEY?.trim();

const SEASONS = ["winter", "preMonsoon", "monsoon", "postMonsoon"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const seasonOf = (m) =>
  m === 11 || m <= 1 ? "winter" : m <= 4 ? "preMonsoon" : m <= 8 ? "monsoon" : "postMonsoon";

const EMBASSY_LOCATION = 8415; // US Diplomatic Post Dhaka via AirNow
const EMBASSY_YEAR = { start: "2024-04-01", end: "2025-03-23" }; // latest full year
const VALIDATION = { start: "2024-10-01", end: "2025-03-23" };

// Neighbourhood → candidate OpenAQ locations; the one with the most data wins.
// Only sensors inside the city are listed (Gazipur/Savar sites are excluded).
const AREAS = [
  { id: "gulshan", name: "Gulshan", candidates: [6234363] },
  { id: "baridhara", name: "Baridhara", candidates: [6242232, 6271076] },
  { id: "dhanmondi", name: "Dhanmondi", candidates: [6240023] },
  { id: "mirpur", name: "Mirpur", candidates: [6240773, 6251395] },
  { id: "uttara", name: "Uttara", candidates: [6157905] },
  { id: "hazaribagh", name: "Hazaribagh", candidates: [6236590] },
  { id: "sabujbagh", name: "Sabujbagh", candidates: [6322838] },
  { id: "moghbazar", name: "Moghbazar", candidates: [6242079] },
  { id: "demra", name: "Demra", candidates: [6313504] },
];
/** A season counts for an area only if every hour of day has this many samples. */
const MIN_SAMPLES_PER_HOUR = 20;

let SOURCE = process.argv.find((a) => a.startsWith("--source="))?.split("=")[1] ?? "embassy";
if (!["embassy", "model"].includes(SOURCE)) throw new Error(`Unknown --source=${SOURCE}`);
if (SOURCE === "embassy" && !OPENAQ_KEY) {
  console.warn("OPENAQ_API_KEY not set: falling back to --source=model.");
  SOURCE = "model";
}

// --- helpers ----------------------------------------------------------------

const round = (v, digits = 0) => Number(v.toFixed(digits));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

function quantile(values, q) {
  const s = [...values].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (pos - lo);
}
const median = (v) => quantile(v, 0.5);
const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;

// US EPA PM2.5 breakpoints (2024 revision): [µg/m³ lo, µg/m³ hi, AQI lo, AQI hi].
const BREAKPOINTS = [
  [0, 9, 0, 50],
  [9.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 125.4, 151, 200],
  [125.5, 225.4, 201, 300],
  [225.5, 325.4, 301, 500],
];
/** AQI for a PM2.5 concentration. Applied per hour, so it is an hourly AQI-equivalent. */
function pm25ToAqi(pm) {
  const c = Math.floor(Math.max(0, pm) * 10) / 10;
  const bp = BREAKPOINTS.find(([, hi]) => c <= hi);
  if (!bp) return 500;
  const [clo, chi, ilo, ihi] = bp;
  return ilo + ((c - clo) / (chi - clo)) * (ihi - ilo);
}

/** "2026-03-10T06..." → { date, month: 2, hour: 6 } (local Dhaka time). */
function parseLocal(s) {
  return { date: s.slice(0, 10), month: Number(s.slice(5, 7)) - 1, hour: Number(s.slice(11, 13)) };
}

async function getJson(url, headers = {}) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status === 408 || res.status >= 500) && attempt < 5) {
      const wait = res.status === 429 ? 61_000 : 5_000 * attempt;
      console.warn(`  ${res.status} from ${new URL(url).host}, retrying in ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    throw new Error(`${res.status} ${res.statusText} for ${url}\n${await res.text()}`);
  }
}

/** [from, to] split into calendar-month chunks; long OpenAQ queries time out (408). */
function monthChunks(from, to) {
  const chunks = [];
  let y = Number(from.slice(0, 4));
  let m = Number(from.slice(5, 7)) - 1;
  for (;;) {
    const first = isoDate(y, m, 1);
    const last = isoDate(y, m, new Date(Date.UTC(y, m + 1, 0)).getUTCDate());
    chunks.push([first < from ? from : first, last > to ? to : last]);
    if (last >= to) return chunks;
    if (++m === 12) [y, m] = [y + 1, 0];
  }
}

// --- periods ----------------------------------------------------------------

const nowDhaka = new Date(Date.now() + 6 * 3600_000); // UTC+6, no DST
const lastMonthEnd = new Date(Date.UTC(nowDhaka.getUTCFullYear(), nowDhaka.getUTCMonth(), 0));
const yearAgo = new Date(
  Date.UTC(lastMonthEnd.getUTCFullYear(), lastMonthEnd.getUTCMonth() - 11, 1),
);
/** Last 12 complete months: the model period and the neighbourhood window's end. */
const RECENT_END = isoDate(
  lastMonthEnd.getUTCFullYear(),
  lastMonthEnd.getUTCMonth(),
  lastMonthEnd.getUTCDate(),
);
const RECENT_START = isoDate(yearAgo.getUTCFullYear(), yearAgo.getUTCMonth(), 1);
const START = SOURCE === "embassy" ? EMBASSY_YEAR.start : RECENT_START;
const END = SOURCE === "embassy" ? EMBASSY_YEAR.end : RECENT_END;
console.log(`City source: ${SOURCE}. Period: ${START} → ${END} (Asia/Dhaka)`);

// --- Open-Meteo -------------------------------------------------------------

async function openMeteo(host, path, variable, from, to) {
  const url =
    `https://${host}${path}?latitude=${LAT}&longitude=${LON}&hourly=${variable}` +
    `&timezone=${encodeURIComponent(TZ)}&start_date=${from}&end_date=${to}`;
  const json = await getJson(url);
  const values = json.hourly[variable];
  return json.hourly.time
    .map((t, i) => ({ t, ...parseLocal(t), v: values[i] }))
    .filter((r) => r.v != null);
}

/** Typical day per group: per-hour median + p25/p75 of `value(row)`. */
function typicalDay(rows, groupOf, value, digits) {
  const groups = {};
  for (const r of rows) {
    (groups[groupOf(r)] ??= Array.from({ length: 24 }, () => []))[r.hour].push(value(r));
  }
  const out = {};
  for (const [g, hours] of Object.entries(groups)) {
    out[g] = hours.map((vals, hour) => ({
      hour,
      median: round(median(vals), digits),
      p25: round(quantile(vals, 0.25), digits),
      p75: round(quantile(vals, 0.75), digits),
    }));
  }
  return out;
}

// --- OpenAQ -----------------------------------------------------------------

async function openaq(path) {
  await sleep(1_100); // stay under 60 requests/minute
  return getJson(`https://api.openaq.org/v3${path}`, { "X-API-Key": OPENAQ_KEY });
}

async function sensorHours(sensorId, from, to) {
  const rows = [];
  for (const [a, b] of monthChunks(from, to)) {
    for (let page = 1; ; page++) {
      const { results } = await openaq(
        `/sensors/${sensorId}/hours?datetime_from=${a}T00:00:00%2B06:00` +
          `&datetime_to=${b}T23:59:59%2B06:00&limit=1000&page=${page}`,
      );
      for (const r of results) {
        const v = r.value;
        if (v == null || v < 0 || v > 1000) continue; // drop sensor glitches
        rows.push({
          t: r.period.datetimeFrom.local,
          ...parseLocal(r.period.datetimeFrom.local),
          v,
        });
      }
      if (results.length < 1000) break;
    }
  }
  return rows;
}

async function locationInfo(id) {
  const loc = (await openaq(`/locations/${id}`)).results[0];
  const pm = loc.sensors.find((s) => s.parameter.name === "pm25");
  return {
    id,
    sensorId: pm?.id ?? null,
    site: loc.name
      .split(/\s*\|\s*/)[0]
      .replace(/\s*[;,]\s*/g, ", ")
      .trim(),
    provider: loc.provider?.name ?? null,
    lat: loc.coordinates.latitude,
    lon: loc.coordinates.longitude,
  };
}

const peakHour = (rows) => {
  const byHour = Array.from({ length: 24 }, () => []);
  rows.forEach((x) => byHour[x.hour].push(x.v));
  const meds = byHour.map(median);
  return meds.indexOf(Math.max(...meds));
};

let cityPm = null;
let validation = null;
let neighbourhoods = null;

if (OPENAQ_KEY) {
  // US Embassy monitor: the city source (default) and the model check.
  console.log("OpenAQ: US Embassy monitor…");
  const embassy = await locationInfo(EMBASSY_LOCATION);
  const embassyRows = await sensorHours(embassy.sensorId, EMBASSY_YEAR.start, EMBASSY_YEAR.end);
  console.log(`  ${embassyRows.length} hours`);
  if (SOURCE === "embassy") cityPm = embassyRows;

  const measured = embassyRows.filter(
    (r) => r.date >= VALIDATION.start && r.date <= VALIDATION.end,
  );
  const model = await openMeteo(
    "air-quality-api.open-meteo.com",
    "/v1/air-quality",
    "pm2_5",
    VALIDATION.start,
    VALIDATION.end,
  );
  const modelAt = new Map(model.map((r) => [r.t.slice(0, 13), r.v]));
  const pairs = measured
    .filter((r) => modelAt.has(r.t.slice(0, 13)))
    .map((r) => [r.v, modelAt.get(r.t.slice(0, 13))]);
  if (pairs.length > 500) {
    const ms = pairs.map((p) => p[0]);
    const md = pairs.map((p) => p[1]);
    const mx = mean(ms);
    const my = mean(md);
    const cov = mean(pairs.map(([a, b]) => (a - mx) * (b - my)));
    const r =
      cov / Math.sqrt(mean(ms.map((a) => (a - mx) ** 2)) * mean(md.map((b) => (b - my) ** 2)));
    validation = {
      station: "US Embassy Dhaka (AirNow, via OpenAQ)",
      locationId: EMBASSY_LOCATION,
      period: VALIDATION,
      hours: pairs.length,
      measuredMeanPm25: round(mx, 1),
      modelMeanPm25: round(my, 1),
      bias: round((my - mx) / mx, 3),
      correlation: round(r, 2),
      measuredPeakHour: peakHour(measured),
      modelPeakHour: peakHour(model),
    };
    console.log(`  model check: ${JSON.stringify(validation)}`);
  }

  // Neighbourhoods: measured PM2.5 per area and season.
  const nFrom = "2025-12-01"; // these sensors were installed from Dec 2025 on
  const nTo = RECENT_END;
  const areas = [];
  for (const area of AREAS) {
    let best = null;
    for (const id of area.candidates) {
      const info = await locationInfo(id);
      if (!info.sensorId) continue;
      const rows = await sensorHours(info.sensorId, nFrom, nTo);
      console.log(`  ${area.name}: location ${id} → ${rows.length} hours`);
      if (!best || rows.length > best.rows.length) best = { info, rows };
    }
    if (!best || best.rows.length === 0) continue;

    const seasons = {};
    for (const s of SEASONS) {
      const rows = best.rows.filter((r) => seasonOf(r.month) === s);
      const byHour = Array.from({ length: 24 }, () => []);
      rows.forEach((r) => byHour[r.hour].push(r.v));
      if (Math.min(...byHour.map((h) => h.length)) < MIN_SAMPLES_PER_HOUR) continue;
      seasons[s] = {
        aqi: byHour.map((vals) => Math.round(pm25ToAqi(median(vals)))),
        days: new Set(rows.map((r) => r.date)).size,
      };
    }
    const dates = best.rows.map((r) => r.date).sort();
    areas.push({
      id: area.id,
      name: area.name,
      site: best.info.site,
      locationId: best.info.id,
      provider: best.info.provider,
      lat: best.info.lat,
      lon: best.info.lon,
      first: dates[0],
      last: dates[dates.length - 1],
      seasons,
    });
  }

  neighbourhoods = {
    meta: {
      demo: false,
      location: { name: "Dhaka", lat: LAT, lon: LON },
      timezone: TZ,
      generatedBy: "scripts/fetch-real-data.mjs",
      generatedAt: new Date().toISOString().slice(0, 10),
      period: { start: nFrom, end: nTo },
      metric: "Measured PM2.5 by neighbourhood, as hourly US AQI",
      unit: "AQI",
      source: "OpenAQ v3: Smart Air Bangladesh / AirGradient low-cost sensors",
      method:
        `Per-hour median of measured PM2.5 converted to US AQI; a season is shown only when every ` +
        `hour of day has at least ${MIN_SAMPLES_PER_HOUR} readings. Low-cost optical sensors, not ` +
        `humidity-corrected`,
    },
    areas,
  };
} else {
  console.warn("OPENAQ_API_KEY not set: skipping neighbourhoods and the model check.");
}

// --- city typical days -------------------------------------------------------

if (!cityPm) {
  console.log("Open-Meteo: hourly PM2.5 (model)…");
  cityPm = await openMeteo(
    "air-quality-api.open-meteo.com",
    "/v1/air-quality",
    "pm2_5",
    START,
    END,
  );
}
console.log("Open-Meteo: hourly temperature…");
const tempRows = await openMeteo(
  "archive-api.open-meteo.com",
  "/v1/archive",
  "temperature_2m",
  START,
  END,
);

const bySeason = (r) => seasonOf(r.month);
const aqiSeasons = typicalDay(cityPm, bySeason, (r) => pm25ToAqi(r.v), 0);
const tempSeasons = typicalDay(tempRows, bySeason, (r) => r.v, 1);
const aqiMonths = typicalDay(
  cityPm,
  (r) => r.month,
  (r) => pm25ToAqi(r.v),
  0,
);
const tempMonths = typicalDay(
  tempRows,
  (r) => r.month,
  (r) => r.v,
  1,
);
for (const s of SEASONS) if (!aqiSeasons[s] || !tempSeasons[s]) throw new Error(`No data for ${s}`);
for (let m = 0; m < 12; m++) if (!aqiMonths[m]) throw new Error(`No data for ${MONTHS[m]}`);

// --- write ------------------------------------------------------------------

const days = new Set(cityPm.map((r) => r.date)).size;
const common = {
  demo: false,
  location: { name: "Dhaka", lat: LAT, lon: LON },
  timezone: TZ,
  generatedBy: "scripts/fetch-real-data.mjs",
  generatedAt: new Date().toISOString().slice(0, 10),
  period: { start: START, end: END },
};
const measured = SOURCE === "embassy";

const files = {
  "aqi.json": {
    meta: {
      ...common,
      metric: "US AQI from hourly PM2.5",
      unit: "AQI",
      citySource: SOURCE,
      source: measured
        ? "US Embassy Dhaka reference monitor (AirNow), via OpenAQ: measured"
        : "Open-Meteo Air Quality API (CAMS global model): modelled",
      method:
        `Hourly ${measured ? "measured" : "modelled"} PM2.5 converted to US AQI (2024 EPA ` +
        `breakpoints); per-hour median and 25th–75th percentile per season over ${days} days`,
      ...(validation ? { validation } : {}),
    },
    seasons: aqiSeasons,
  },
  "temperature.json": {
    meta: {
      ...common,
      metric: "Air temperature at 2 m",
      unit: "°C",
      source: "Open-Meteo Historical Weather API (ERA5 reanalysis)",
      method: `Per-hour median and 25th–75th percentile per season over the same dates as the AQI`,
    },
    seasons: tempSeasons,
  },
  "months.json": {
    meta: {
      ...common,
      metric: "US AQI and air temperature, typical day per month",
      unit: "AQI / °C",
      source: measured
        ? "US Embassy Dhaka monitor (AQI) + Open-Meteo ERA5 (temperature)"
        : "Open-Meteo Air Quality + Historical Weather APIs",
      method: "Per-hour median for each calendar month of the period",
    },
    months: MONTHS.map((label, m) => ({
      month: m,
      label,
      aqi: aqiMonths[m].map((p) => p.median),
      temp: tempMonths[m].map((p) => p.median),
    })),
  },
  ...(neighbourhoods ? { "neighbourhoods.json": neighbourhoods } : {}),
};

for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(outDir, name), JSON.stringify(data, null, 2) + "\n");
  console.log(`wrote src/data/${name}`);
}
console.log("traffic.json left unchanged (estimated index; no open hourly source).");
