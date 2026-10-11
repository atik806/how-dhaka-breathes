// US EPA AQI categories. `color` is the official swatch; `display` is a
// lightened variant used for strokes/text so the darker categories stay
// legible on the page's dark background.
export type AqiCategory = {
  name: string;
  short: string;
  min: number;
  max: number;
  color: string;
  display: string;
};

export const AQI_CATEGORIES: AqiCategory[] = [
  {
    name: "Good",
    short: "Good",
    min: 0,
    max: 50,
    color: "#00e400",
    display: "#4ade80",
  },
  {
    name: "Moderate",
    short: "Moderate",
    min: 51,
    max: 100,
    color: "#ffff00",
    display: "#fde047",
  },
  {
    name: "Unhealthy for Sensitive Groups",
    short: "Sensitive",
    min: 101,
    max: 150,
    color: "#ff7e00",
    display: "#fb923c",
  },
  {
    name: "Unhealthy",
    short: "Unhealthy",
    min: 151,
    max: 200,
    color: "#ff0000",
    display: "#f87171",
  },
  {
    name: "Very Unhealthy",
    short: "Very unhealthy",
    min: 201,
    max: 300,
    color: "#8f3f97",
    display: "#c084fc",
  },
  {
    name: "Hazardous",
    short: "Hazardous",
    min: 301,
    max: 500,
    color: "#7e0023",
    display: "#e11d48",
  },
];

export function aqiCategory(value: number): AqiCategory {
  const v = Math.round(value);
  return AQI_CATEGORIES.find((c) => v <= c.max) ?? AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
}

/** Categories light enough that text on their official color must be dark. */
export const DARK_TEXT_CATEGORIES = new Set(["Good", "Moderate", "Unhealthy for Sensitive Groups"]);

/** Unhealthy for everyone = AQI above 150. */
export const UNHEALTHY_THRESHOLD = 150;

/** Plain-language guidance per category, paraphrasing US EPA / AirNow advice. */
export const AQI_ADVICE: Record<string, string> = {
  Good: "The air is clean. A good time to be outside.",
  Moderate:
    "Fine for most people. If you are unusually sensitive to air pollution, keep long or heavy exercise outdoors short.",
  "Unhealthy for Sensitive Groups":
    "Children, older adults, pregnant women and people with heart or lung conditions should cut back on long or heavy exercise outdoors.",
  Unhealthy:
    "Everyone should cut back on long or heavy exercise outdoors, and sensitive groups should avoid it. A well-fitted N95/KN95 mask helps.",
  "Very Unhealthy":
    "Everyone should avoid long or heavy exercise outdoors. Sensitive groups should stay indoors with the windows closed.",
  Hazardous: "Everyone should avoid any exercise outdoors and stay indoors if possible.",
};

// PM2.5 breakpoints from the 2024 US EPA revision: [AQI lo, AQI hi, µg/m³ lo, µg/m³ hi].
const PM25_BREAKPOINTS: [number, number, number, number][] = [
  [0, 50, 0, 9],
  [51, 100, 9.1, 35.4],
  [101, 150, 35.5, 55.4],
  [151, 200, 55.5, 125.4],
  [201, 300, 125.5, 225.4],
  [301, 500, 225.5, 325.4],
];

/** Inverts the EPA formula: the PM2.5 concentration (µg/m³) behind an AQI value. */
export function aqiToPm25(aqi: number): number {
  const v = Math.max(0, Math.min(500, aqi));
  const [ilo, ihi, clo, chi] =
    PM25_BREAKPOINTS.find(([, hi]) => v <= hi) ?? PM25_BREAKPOINTS[PM25_BREAKPOINTS.length - 1];
  return clo + ((v - ilo) / (ihi - ilo)) * (chi - clo);
}

/**
 * Berkeley Earth rule of thumb (Muller & Muller, 2015): breathing 22 µg/m³ of
 * PM2.5 for a day is roughly as harmful as smoking one cigarette.
 */
export const PM25_PER_CIGARETTE = 22;

export function cigarettesPerDay(meanPm25: number): number {
  return meanPm25 / PM25_PER_CIGARETTE;
}
