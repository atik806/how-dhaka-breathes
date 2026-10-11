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
  generatedAt?: string;
  /** Inclusive local dates the data covers (real data only). */
  period?: { start: string; end: string };
  /** "embassy" = measured reference monitor, "model" = Open-Meteo CAMS. */
  citySource?: "embassy" | "model";
  validation?: ModelCheck;
};

/** How the air-quality model compared with the US Embassy monitor. */
export type ModelCheck = {
  station: string;
  period: { start: string; end: string };
  hours: number;
  measuredMeanPm25: number;
  modelMeanPm25: number;
  /** (model − measured) / measured */
  bias: number;
  correlation: number;
  measuredPeakHour: number;
  modelPeakHour: number;
};

export type SeasonDataset = {
  meta: DatasetMeta;
  seasons: Record<Season, Series>;
};
export type TrafficDataset = {
  meta: DatasetMeta;
  days: Record<DayType, Series>;
};

export type Layer = "aqi" | "traffic" | "temp";

export type MonthRow = {
  month: number;
  label: string;
  aqi: number[];
  temp: number[];
};
export type MonthsDataset = { meta: DatasetMeta; months: MonthRow[] };

export type Neighbourhood = {
  id: string;
  name: string;
  /** Sensor site name (real data) or a short description (demo). */
  site: string;
  locationId: number | null;
  provider: string | null;
  first: string | null;
  last: string | null;
  /** Typical-day AQI per season; a season is absent when there isn't enough data. */
  seasons: Partial<Record<Season, { aqi: number[]; days: number }>>;
};
export type NeighbourhoodDataset = {
  meta: DatasetMeta;
  areas: Neighbourhood[];
};
