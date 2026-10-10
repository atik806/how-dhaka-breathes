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

/** A neighbourhood's typical-day AQI, derived from the city curve and weekday traffic. */
export function neighbourhoodSeries(area: Neighbourhood, season: Season): number[] {
  const city = aqiData.seasons[season];
  const traffic = trafficData.days.weekday;
  return city.map((p, h) =>
    Math.round(p.median * area.factor * (1 + area.rush * (traffic[h].median / 100 - 0.55))),
  );
}
