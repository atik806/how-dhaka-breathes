// Generates the DEMO data used by "How Dhaka Breathes".
//
// The numbers are synthetic: hand-shaped daily curves that follow the patterns
// reported for Dhaka (overnight/morning AQI peaks, an afternoon dip, a
// winter-heavy season, morning and evening traffic rushes), plus seeded noise.
// They are NOT measurements. Swap this script for a real fetcher (e.g. the
// Open-Meteo Air Quality + Historical Weather APIs) to make the story real.
//
// Run: npm run data

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(outDir, { recursive: true });

// Deterministic PRNG so regenerating gives identical files.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261010);
const jitter = (amount) => (rand() * 2 - 1) * amount;
const round = (v, digits = 0) => Number(v.toFixed(digits));

const SEASONS = ["winter", "preMonsoon", "monsoon", "postMonsoon"];

// 0..1 daily shapes, index = local hour (Asia/Dhaka).
const AQI_SHAPE = [
  0.7, 0.68, 0.67, 0.68, 0.72, 0.8, 0.9, 0.98, 1.0, 0.92, 0.75, 0.55, 0.38, 0.24, 0.15, 0.12, 0.18,
  0.32, 0.52, 0.7, 0.82, 0.88, 0.86, 0.78,
];
const TEMP_SHAPE = [
  0.22, 0.17, 0.12, 0.08, 0.04, 0.01, 0.0, 0.06, 0.2, 0.38, 0.56, 0.72, 0.85, 0.95, 1.0, 0.97, 0.88,
  0.74, 0.6, 0.49, 0.41, 0.35, 0.3, 0.26,
];
const TRAFFIC = {
  weekday: [
    28, 20, 14, 11, 10, 14, 30, 58, 82, 90, 80, 70, 66, 64, 66, 70, 78, 88, 95, 92, 80, 64, 50, 38,
  ],
  // Friday: weekend morning, a dip around Jumu'ah prayer, a softer evening.
  friday: [
    30, 22, 15, 11, 9, 8, 10, 16, 24, 32, 40, 42, 30, 38, 50, 58, 64, 70, 72, 70, 64, 54, 44, 36,
  ],
};

// [min, max, relative p25/p75 spread]
const AQI_RANGE = {
  winter: [140, 285, 0.14],
  preMonsoon: [85, 165, 0.2],
  monsoon: [32, 78, 0.3],
  postMonsoon: [95, 195, 0.18],
};
// [min °C, max °C, absolute p25/p75 spread]
const TEMP_RANGE = {
  winter: [13.5, 25.5, 1.6],
  preMonsoon: [24.5, 34.5, 1.8],
  monsoon: [27, 32, 1.0],
  postMonsoon: [20, 30.5, 1.5],
};

// Monthly ranges average out to the seasonal ranges above, so the year heatmap
// and the season charts agree. [min, max]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const AQI_MONTH = [
  [150, 295],
  [125, 270],
  [110, 200],
  [85, 160],
  [60, 135],
  [38, 88],
  [28, 70],
  [30, 72],
  [32, 82],
  [75, 155],
  [115, 235],
  [145, 290],
];
const TEMP_MONTH = [
  [12.5, 24.5],
  [14, 26],
  [21.5, 33],
  [25.5, 35],
  [26.5, 35.5],
  [27, 32.5],
  [27, 31.5],
  [27, 32],
  [27, 32],
  [23.5, 31.5],
  [16.5, 29.5],
  [14, 26],
];

// Illustrative neighbourhood profiles. `factor` scales the city curve;
// `rush` adds extra pollution in proportion to traffic (busy road corridors).
const NEIGHBOURHOODS = [
  {
    id: "gulshan",
    name: "Gulshan",
    factor: 0.88,
    rush: 0.06,
    note: "Diplomatic zone, lakes and more tree cover",
  },
  {
    id: "dhanmondi",
    name: "Dhanmondi",
    factor: 0.93,
    rush: 0.1,
    note: "Residential, a lake and moderate traffic",
  },
  {
    id: "uttara",
    name: "Uttara",
    factor: 0.96,
    rush: 0.12,
    note: "Planned suburb near the airport highway",
  },
  {
    id: "mohammadpur",
    name: "Mohammadpur",
    factor: 1.02,
    rush: 0.1,
    note: "Dense housing near the river and kiln belt",
  },
  {
    id: "mirpur",
    name: "Mirpur",
    factor: 1.05,
    rush: 0.14,
    note: "Large population and heavy metro construction",
  },
  {
    id: "motijheel",
    name: "Motijheel",
    factor: 1.08,
    rush: 0.22,
    note: "Commercial core with peak-hour gridlock",
  },
  {
    id: "tejgaon",
    name: "Tejgaon",
    factor: 1.12,
    rush: 0.16,
    note: "Industrial area with lots of truck traffic",
  },
  {
    id: "old-dhaka",
    name: "Old Dhaka",
    factor: 1.16,
    rush: 0.18,
    note: "Narrow lanes, small industry and generators",
  },
];

function monthAqi(m) {
  const [min, max] = AQI_MONTH[m];
  return AQI_SHAPE.map((s) => round((min + s * (max - min)) * (1 + jitter(0.02))));
}
function monthTemp(m) {
  const [min, max] = TEMP_MONTH[m];
  return TEMP_SHAPE.map((s) => round(min + s * (max - min) + jitter(0.25), 1));
}

function aqiSeries(season) {
  const [min, max, spread] = AQI_RANGE[season];
  return AQI_SHAPE.map((s, hour) => {
    const median = (min + s * (max - min)) * (1 + jitter(0.02));
    return {
      hour,
      median: round(median),
      p25: round(median * (1 - spread * (0.85 + rand() * 0.3))),
      p75: round(median * (1 + spread * (0.85 + rand() * 0.3))),
    };
  });
}

function tempSeries(season) {
  const [min, max, spread] = TEMP_RANGE[season];
  return TEMP_SHAPE.map((s, hour) => {
    const median = min + s * (max - min) + jitter(0.25);
    return {
      hour,
      median: round(median, 1),
      p25: round(median - spread * (0.8 + rand() * 0.4), 1),
      p75: round(median + spread * (0.8 + rand() * 0.4), 1),
    };
  });
}

function trafficSeries(day) {
  return TRAFFIC[day].map((v, hour) => {
    const median = Math.min(100, Math.max(0, v + jitter(1.5)));
    return {
      hour,
      median: round(median),
      p25: round(Math.max(0, median * 0.9)),
      p75: round(Math.min(100, median * 1.08)),
    };
  });
}

const common = {
  demo: true,
  location: { name: "Dhaka", lat: 23.8103, lon: 90.4125 },
  timezone: "Asia/Dhaka",
  generatedBy: "scripts/generate-demo-data.mjs",
};

const files = {
  "aqi.json": {
    meta: {
      ...common,
      metric: "US AQI (PM2.5-driven)",
      unit: "AQI",
      source: "Demo data: synthetic, shaped after published Dhaka diurnal PM2.5 patterns",
      method:
        "Hand-shaped 24h curve scaled per season, ±2% seeded noise; p25/p75 band is synthetic",
    },
    seasons: Object.fromEntries(SEASONS.map((s) => [s, aqiSeries(s)])),
  },
  "temperature.json": {
    meta: {
      ...common,
      metric: "Air temperature at 2 m",
      unit: "°C",
      source: "Demo data: synthetic, shaped after Dhaka seasonal climate normals",
      method: "Hand-shaped 24h curve scaled per season, ±0.25 °C seeded noise",
    },
    seasons: Object.fromEntries(SEASONS.map((s) => [s, tempSeries(s)])),
  },
  "traffic.json": {
    meta: {
      ...common,
      metric: "Relative congestion index",
      unit: "index (0–100)",
      source: "Demo data: estimated index, no open hourly traffic feed exists for Dhaka",
      method: "Hand-shaped from typical commute patterns; 100 = worst hour of a typical weekday",
    },
    days: {
      weekday: trafficSeries("weekday"),
      friday: trafficSeries("friday"),
    },
  },
  // Generated after the files above so their seeded values stay unchanged.
  "months.json": {
    meta: {
      ...common,
      metric: "US AQI and air temperature, typical day per month",
      unit: "AQI / °C",
      source: "Demo data: synthetic, consistent with the seasonal curves",
      method: "Same 24h shapes scaled per month; monthly ranges average to the seasonal ranges",
    },
    months: MONTHS.map((label, m) => ({
      month: m,
      label,
      aqi: monthAqi(m),
      temp: monthTemp(m),
    })),
  },
};

// Same shape as the real fetcher: a typical-day AQI curve per season and area.
const cityAqi = files["aqi.json"].seasons;
const weekdayTraffic = files["traffic.json"].days.weekday;
files["neighbourhoods.json"] = {
  meta: {
    ...common,
    metric: "Illustrative AQI profile by neighbourhood",
    unit: "AQI",
    source: "Demo data: illustrative profiles, not station readings",
    method: "City curve × factor × (1 + rush × (traffic/100 − 0.55))",
  },
  areas: NEIGHBOURHOODS.map(({ id, name, factor, rush, note }) => ({
    id,
    name,
    site: note,
    locationId: null,
    provider: null,
    first: null,
    last: null,
    seasons: Object.fromEntries(
      SEASONS.map((s) => [
        s,
        {
          aqi: cityAqi[s].map((p, h) =>
            Math.round(p.median * factor * (1 + rush * (weekdayTraffic[h].median / 100 - 0.55))),
          ),
          days: 90,
        },
      ]),
    ),
  })),
};

for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(outDir, name), JSON.stringify(data, null, 2) + "\n");
  console.log(`wrote src/data/${name}`);
}
