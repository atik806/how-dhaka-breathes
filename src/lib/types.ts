export type HourPoint = {
  /** Local hour in Asia/Dhaka, 0–23. */
  hour: number;
  median: number;
  p25: number;
  p75: number;
};

export type Series = HourPoint[];

export type Season = "winter" | "preMonsoon" | "monsoon" | "postMonsoon";
export type DayType = "weekday" | "friday";

export type DatasetMeta = {
  demo: boolean;
  location: { name: string; lat: number; lon: number };
  timezone: string;
  generatedBy: string;
  metric: string;
  unit: string;
  source: string;
  method: string;
};

export type SeasonDataset = { meta: DatasetMeta; seasons: Record<Season, Series> };
export type TrafficDataset = { meta: DatasetMeta; days: Record<DayType, Series> };

export type Layer = "aqi" | "traffic" | "temp";

export type MonthRow = { month: number; label: string; aqi: number[]; temp: number[] };
export type MonthsDataset = { meta: DatasetMeta; months: MonthRow[] };

export type Neighbourhood = {
  id: string;
  name: string;
  factor: number;
  rush: number;
  note: string;
};
export type NeighbourhoodDataset = { meta: DatasetMeta; areas: Neighbourhood[] };
