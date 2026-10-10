@AGENTS.md

# How Dhaka Breathes: project brief

A scroll-driven data story showing how Dhaka's AQI, traffic congestion and temperature change
hour by hour. **Frontend only**: no backend, no runtime API calls, static export (`out/`).

## Stack
- Next.js 16 App Router, TypeScript strict, `output: "export"`. `cacheComponents` and
  `partialPrefetching` must stay off because PPR is not supported in export mode.
- Tailwind v4 (theme tokens in `src/app/globals.css`: bg/panel/ink/mute/line/heat/traffic).
- D3 (`d3-scale`, `d3-shape`, `d3-array`) for math only; charts are React-owned SVG.
- `motion/react` for transitions; IntersectionObserver for scroll steps (`useActiveStep`).
- React Compiler is on, so avoid reassigning variables during render (lint enforces this).

## Chapters
Hero + NowCard → DayStory → SeasonStory → year (YearHeatmap) → neighbourhoods
(NeighbourhoodChart) → health (HourGrid + HealthPanel) → plan (Planner) → Methodology.
ChapterNav (progress bar + dot nav) lists the section ids, so keep it in sync when adding one.

## Data rules
- `months.json` monthly ranges are chosen to average to the seasonal ranges, so the charts agree.
- Neighbourhood series = city curve × factor × (1 + rush × (traffic/100 − 0.55)). They are illustrative.
- Anything that uses the clock (`useDhakaNow`) returns null on the server, so render a same-size placeholder.
- Data is static JSON in `src/data/`, produced by `npm run data`. It is currently DEMO data.
- Hours are local `Asia/Dhaka`, 0–23. Each line is a median "typical day" with a p25/p75 band.
- Traffic has no open source, so always label it an "estimated index".
- Story copy lives in `src/lib/story.ts` and is computed from the data. Never hardcode a
  number in prose.
- Don't claim causation between traffic and AQI. Kilns, dust and weather also drive AQI.

## Design rules
- Dark editorial look: Fraunces display + Geist body, tabular numerals for data.
- AQI uses the official EPA scale (`src/lib/aqi.ts`). `display` colors are for strokes on dark.
- Animate meaning (draw-on, hour marker, season morph), 300–800 ms, no bouncy springs on data.
- `prefers-reduced-motion` is respected via `useReducedMotion` and a CSS media query.
- Every chart has a `DataTable` twin. The day chart is a keyboard slider (arrows/Home/End).
- Mobile-first: on narrow screens the chart pins to the top and the step cards scroll below.

## Done means
`npx tsc --noEmit`, `npm run lint` and `npm run build` are clean. Check visually at 390px
and 1440px wide.
