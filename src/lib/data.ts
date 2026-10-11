import aqiJson from "@/data/aqi.json";
import monthsJson from "@/data/months.json";
import neighbourhoodsJson from "@/data/neighbourhoods.json";
import temperatureJson from "@/data/temperature.json";
import trafficJson from "@/data/traffic.json";
import type {
  MonthsDataset,
  Neighbourhood,
  NeighbourhoodDataset,
  Season,
  SeasonDataset,
  TrafficDataset,
} from "./types";

export const aqiData = aqiJson as SeasonDataset;
export const temperatureData = temperatureJson as SeasonDataset;
export const trafficData = trafficJson as TrafficDataset;

export const SEASONS: { id: Season; label: string; months: string }[] = [
  { id: "winter", label: "Winter", months: "Dec–Feb" },
  { id: "preMonsoon", label: "Pre-monsoon", months: "Mar–May" },
  { id: "monsoon", label: "Monsoon", months: "Jun–Sep" },
  { id: "postMonsoon", label: "Post-monsoon", months: "Oct–Nov" },
];

export const HOURS = Array.from({ length: 24 }, (_, h) => h);

export const monthsData = monthsJson as MonthsDataset;
export const neighbourhoodData = neighbourhoodsJson as NeighbourhoodDataset;

/** Month index (0 = Jan) → season. */
export function seasonOfMonth(month: number): Season {
  if (month === 11 || month <= 1) return "winter";
  if (month <= 4) return "preMonsoon";
  if (month <= 8) return "monsoon";
  return "postMonsoon";
}

/** A neighbourhood's typical-day AQI for a season, or null without enough data. */
export function neighbourhoodSeries(area: Neighbourhood, season: Season): number[] | null {
  return area.seasons[season]?.aqi ?? null;
}

/** Seasons with at least two neighbourhoods to compare. */
export const NEIGHBOURHOOD_SEASONS = SEASONS.filter(
  (s) => neighbourhoodData.areas.filter((a) => a.seasons[s.id]).length >= 2,
);

/** True when every dataset on the page is synthetic. */
export const ALL_DEMO = [aqiData, temperatureData, monthsData, neighbourhoodData].every(
  (d) => d.meta.demo,
);

/** "Apr 2024 – Mar 2025" for a dataset's period. */
export function periodLabel(period?: { start: string; end: string }): string {
  if (!period) return "";
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(period.start)} – ${fmt(period.end)}`;
}

/** Upper y-domain bound: at least 300, rounded up to the next 50. */
export function aqiCeiling(values: number[]): number {
  return Math.max(300, Math.ceil(Math.max(...values) / 50) * 50);
}
