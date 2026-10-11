// Fetches the LATEST hourly PM2.5 reading from every OpenAQ sensor around Dhaka
// and writes src/data/latest.json for the "right now, by location" ranking.
//
// The site is a static export and the OpenAQ key must stay out of the browser,
// so this is a snapshot taken at build time, not a live feed. Re-run it (and
// rebuild) to refresh: npm run data:latest
//
// Reads OPENAQ_API_KEY from .env.local.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outFile = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "latest.json");

const KEY = process.env.OPENAQ_API_KEY?.trim();
if (!KEY) {
  console.error("OPENAQ_API_KEY is empty. Paste your key into .env.local (see README).");
  process.exit(1);
}

const LAT = 23.8103;
const LON = 90.4125;
const RADIUS_M = 25_000;
/** Readings older than this are left out of the ranking. */
const MAX_AGE_HOURS = 3;

// Friendly place names for known OpenAQ locations; anything else falls back to
// the first part of the location's own name.
const PLACES = {
  6157905: { name: "Uttara", district: "Dhaka" },
  6219691: { name: "North Badda", district: "Dhaka" },
  6234078: { name: "Kaliganj", district: "Gazipur" },
  6234363: { name: "Gulshan", district: "Dhaka" },
  6236590: { name: "Hazaribagh", district: "Dhaka" },
  6240023: { name: "Dhanmondi", district: "Dhaka" },
  6240773: { name: "Mirpur (Kalshi)", district: "Dhaka" },
  6242079: { name: "Moghbazar", district: "Dhaka" },
  6242232: { name: "Baridhara", district: "Dhaka" },
  6251395: { name: "Mirpur (Shewrapara)", district: "Dhaka" },
  6271076: { name: "Baridhara Lakeside", district: "Dhaka" },
  6313504: { name: "Demra", district: "Dhaka" },
  6322838: { name: "Sabujbagh", district: "Dhaka" },
  3194367: { name: "Jahangirnagar University", district: "Savar" },
  6528096: { name: "Jahangirnagar University", district: "Savar" },
  5105944: { name: "Smart Air office", district: "Dhaka" },
};

// 2024 US EPA PM2.5 breakpoints, same as the site (src/lib/aqi.ts).
const BREAKPOINTS = [
  [0, 9, 0, 50],
  [9.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 125.4, 151, 200],
  [125.5, 225.4, 201, 300],
  [225.5, 325.4, 301, 500],
];
function pm25ToAqi(pm) {
  const c = Math.floor(Math.max(0, pm) * 10) / 10;
  const bp = BREAKPOINTS.find(([, hi]) => c <= hi);
  if (!bp) return 500;
  const [clo, chi, ilo, ihi] = bp;
  return Math.round(ilo + ((c - clo) / (chi - clo)) * (ihi - ilo));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function openaq(path) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://api.openaq.org/v3${path}`, {
      headers: { "X-API-Key": KEY },
    });
    if (res.ok) return res.json();
    if (attempt < 3 && [408, 429, 500, 502, 503, 504].includes(res.status)) {
      await sleep(2_000 * (attempt + 1));
      continue;
    }
    throw new Error(`OpenAQ ${res.status} for ${path}: ${await res.text()}`);
  }
}

console.log("OpenAQ: locations near Dhaka…");
const { results: locations } = await openaq(
  `/locations?coordinates=${LAT},${LON}&radius=${RADIUS_M}&limit=100`,
);

const now = Date.now();
const places = [];
for (const loc of locations) {
  const pm = loc.sensors?.find((s) => s.parameter?.name === "pm25");
  if (!pm) continue;
  // Skip locations whose feed ended long ago without spending a request.
  const last = loc.datetimeLast?.utc ? Date.parse(loc.datetimeLast.utc) : 0;
  if (now - last > MAX_AGE_HOURS * 3600_000) continue;

  await sleep(1_100); // stay under 60 requests/minute
  const { results } = await openaq(`/locations/${loc.id}/latest`);
  const reading = results.find((r) => r.sensorsId === pm.id);
  if (!reading || reading.value == null || reading.value < 0 || reading.value > 1000) continue;
  const at = Date.parse(reading.datetime.utc);
  if (now - at > MAX_AGE_HOURS * 3600_000) continue;

  const place = PLACES[loc.id] ?? {
    name: loc.name.split(/\s*[|,;]\s*/)[0].trim(),
    district: "Dhaka",
  };
  places.push({
    id: String(loc.id),
    name: place.name,
    district: place.district,
    locationId: loc.id,
    provider: loc.provider?.name ?? null,
    pm25: Number(reading.value.toFixed(1)),
    aqi: pm25ToAqi(reading.value),
    time: reading.datetime.local,
  });
  console.log(`  ${place.name}: ${reading.value} µg/m³ at ${reading.datetime.local}`);
}

// Two sensors in the same place: keep the more recent reading.
const byName = new Map();
for (const p of places) {
  const prev = byName.get(p.name);
  if (!prev || p.time > prev.time) byName.set(p.name, p);
}
const ranked = [...byName.values()].sort((a, b) => b.aqi - a.aqi);

const data = {
  meta: {
    demo: false,
    location: { name: "Dhaka", lat: LAT, lon: LON },
    timezone: "Asia/Dhaka",
    generatedBy: "scripts/fetch-latest.mjs",
    fetchedAt: new Date(now).toISOString(),
    metric: "Latest hourly PM2.5 per sensor, as US AQI",
    unit: "AQI",
    source: "OpenAQ v3: Smart Air Bangladesh / AirGradient low-cost sensors",
    method:
      `Most recent hourly reading per location within ${RADIUS_M / 1000} km of Dhaka, ` +
      `converted with the 2024 EPA breakpoints; readings older than ${MAX_AGE_HOURS} h are left out`,
  },
  places: ranked,
};

writeFileSync(outFile, JSON.stringify(data, null, 2) + "\n");
console.log(`wrote src/data/latest.json (${ranked.length} places)`);
