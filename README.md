# How Dhaka Breathes

A scroll-driven data story: Dhaka's air quality (AQI), traffic and temperature, hour by
hour, across a typical day, the seasons, the year and the city's neighbourhoods. It is
frontend-only and builds to a fully static site.

Chapters: **Right now** card (live Dhaka clock) → **The day** (sticky scrollytelling) →
**Seasons** → **The year** (12×24 heatmap) → **Neighbourhoods** → **Your health**
(EPA advice, PM2.5, cigarette equivalent) → **Plan your time outside** (cleanest/worst
window finder) → **Methodology**.

> **Real data.** Citywide air quality is *measured* by the US Embassy Dhaka reference monitor
> (Apr 2024 – Mar 2025), neighbourhoods by Smart Air Bangladesh low-cost sensors (2026), both
> via OpenAQ. Temperature is Open-Meteo ERA5. Traffic is an *estimated* index: Dhaka has no
> open hourly traffic data.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → out/
npm run data:real   # fetch real data (needs OPENAQ_API_KEY in .env.local)
npm run data:latest # refresh the latest-readings ranking (needs the key)
npm run data        # or: regenerate synthetic demo data
```

`out/` can be deployed to any static host (Vercel, Netlify, GitHub Pages).

## Structure

| Path | What it is |
| --- | --- |
| `src/app/page.tsx` | The story: Hero → Day → Seasons → Hours → Methodology |
| `src/components/story/` | Sections (`DayStory` is the sticky scrollytelling part) |
| `src/components/charts/` | React-owned SVG charts; D3 is used only for scales and shapes |
| `src/lib/story.ts` | Story text **computed from the data**, so text and numbers stay in sync |
| `src/lib/aqi.ts` | US EPA AQI categories, colors, health advice, AQI→PM2.5 (2024 breakpoints) |
| `src/lib/plan.ts` | Sliding-window search for the cleanest/worst outdoor window |
| `src/lib/hooks.ts` | `useSize`, `useActiveStep`, `useDhakaNow` (live Asia/Dhaka clock) |
| `src/data/*.json` | Generated demo data (committed) |

## Data pipeline

`scripts/fetch-real-data.mjs` (`npm run data:real`) writes the JSON files the site reads:

| File | Source |
| --- | --- |
| `aqi.json`, `months.json` | US Embassy monitor via OpenAQ, hourly PM2.5 → hourly US AQI (2024 EPA breakpoints) |
| `temperature.json` | Open-Meteo Historical Weather (ERA5), same dates |
| `neighbourhoods.json` | OpenAQ low-cost sensors; a season appears only with ≥ 20 readings per hour of day |
| `traffic.json` | Not fetched. Estimated index from the demo generator |

`scripts/fetch-latest.mjs` (`npm run data:latest`) writes `latest.json`: the most recent hourly
PM2.5 reading from every OpenAQ sensor within 25 km of Dhaka, ranked most polluted → cleanest.
Sensors that haven't reported in 3 hours are skipped. The site is a static export and the key
must stay server-side, so this is a build-time snapshot: re-run it and rebuild to refresh.

`npm run data:real -- --source=model` uses the Open-Meteo CAMS model for citywide AQI instead
(last 12 months, no key). The fetcher checks the model against the Embassy monitor: it read
**48% low** and put the daily peak at 7 am instead of 2 am, so the measured data is the default.
Labels on the page (demo / measured / modelled) follow each file's `meta`.

## OpenAQ API key (optional, for measured data)

1. Copy your key from <https://explore.openaq.org/account>.
2. Paste it into `.env.local` (git-ignored): `OPENAQ_API_KEY=your-key`.
3. Run `npm run openaq:check` to verify it and list monitoring stations near Dhaka.

The key is only used by Node scripts at build time. Never put it in client code or commit it.
