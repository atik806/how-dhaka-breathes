// Story copy is computed from the data so the words can never drift from the
// numbers on screen. Change the data and the narrative follows.
import { aqiCategory, UNHEALTHY_THRESHOLD } from "./aqi";
import { aqiData, temperatureData, trafficData } from "./data";
import { hourLabel, hourRangeLabel } from "./format";
import type { HourPoint, Layer, Season, Series } from "./types";

export function extremeIn(
  series: Series,
  from: number,
  to: number,
  kind: "max" | "min",
): HourPoint {
  const window = series.filter((p) => p.hour >= from && p.hour <= to);
  return window.reduce((best, p) =>
    kind === "max" ? (p.median > best.median ? p : best) : p.median < best.median ? p : best,
  );
}

export function seasonStats(season: Season) {
  const aqi = aqiData.seasons[season];
  const worst = extremeIn(aqi, 0, 23, "max");
  const cleanest = extremeIn(aqi, 0, 23, "min");
  const mean = Math.round(aqi.reduce((sum, p) => sum + p.median, 0) / aqi.length);
  const unhealthyHours = aqi.filter((p) => p.median > UNHEALTHY_THRESHOLD).length;
  return { worst, cleanest, mean, unhealthyHours };
}

export type StoryStep = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  /** Hour window highlighted on the chart, inclusive. */
  range: [number, number] | null;
  layers: Layer[];
  /** Hour the marker sits on while this step is active. */
  focusHour: number;
};

/** The "typical day" the main story walks through. */
export const STORY_SEASON: Season = "winter";

export function buildDaySteps(): StoryStep[] {
  const aqi = aqiData.seasons[STORY_SEASON];
  const temp = temperatureData.seasons[STORY_SEASON];
  const traffic = trafficData.days.weekday;
  const at = (h: number) => aqi[h].median;
  const cat = (v: number) => aqiCategory(v).name.toLowerCase();

  const dayMax = extremeIn(aqi, 0, 23, "max");
  const morningAqi = extremeIn(aqi, 5, 11, "max");
  const morningTraffic = extremeIn(traffic, 6, 11, "max");
  const tempPeak = extremeIn(temp, 10, 17, "max");
  const dayMin = extremeIn(aqi, 0, 23, "min");
  const eveningTraffic = extremeIn(traffic, 15, 21, "max");
  const eveningAqi = extremeIn(aqi, 18, 23, "max");
  const { unhealthyHours } = seasonStats(STORY_SEASON);
  const trafficIsDayPeak = eveningTraffic.median >= morningTraffic.median;

  const nightRising = at(6) > at(0);
  const nightNearPeak = at(0) >= dayMax.median * 0.9;
  // Real Dhaka data: AQI often *falls* through the morning rush as the sun mixes the air.
  const morningFalling = at(10) < at(7) - 5;
  const worstAtNight = dayMax.hour >= 21 || dayMax.hour <= 5;

  return [
    {
      id: "night",
      kicker: hourRangeLabel(0, 6),
      title: "The city sleeps, and the air stays put",
      body:
        `At midnight the AQI reads ${at(0)}, which is ${cat(at(0))}` +
        (nightNearPeak ? ", close to the worst of the day. " : ". ") +
        `On still winter nights a lid of cool air settles over the city, and smoke from kilns, ` +
        `cooking fires and late-night trucks has nowhere to go. ` +
        (nightRising
          ? `By ${hourLabel(6, "long")} it has climbed to ${at(6)}.`
          : `Even by ${hourLabel(6, "long")} it has only eased to ${at(6)}.`),
      range: [0, 6],
      layers: ["aqi"],
      focusHour: 6,
    },
    {
      id: "morning",
      kicker: hourRangeLabel(7, 10),
      title: morningFalling
        ? "Rush hour, and the lid starts to lift"
        : "Rush hour meets a sky that hasn't cleared",
      body:
        `The roads fill fast: congestion hits ${morningTraffic.median}/100 at ` +
        `${hourLabel(morningTraffic.hour, "long")}. ` +
        (morningFalling
          ? `Yet the AQI falls, from ${at(7)} at ${hourLabel(7, "long")} to ${at(10)} by ` +
            `${hourLabel(10, "long")}. As the sun warms the ground, the trapped night air starts ` +
            `to mix upward, which suggests the weather, more than the traffic, sets the level at ` +
            `this hour.`
          : `AQI peaks at ${morningAqi.median} around ${hourLabel(morningAqi.hour, "long")}` +
            (morningAqi.hour === dayMax.hour ? ", the worst air of the whole day." : ".") +
            ` Fresh exhaust piles into air that is still trapped from the night.`),
      range: [7, 10],
      layers: ["aqi", "traffic"],
      focusHour: morningFalling ? 10 : morningAqi.hour,
    },
    {
      id: "afternoon",
      kicker: hourRangeLabel(12, 16),
      title: "The sun does what the traffic police can't",
      body:
        `By ${hourLabel(tempPeak.hour, "long")} it is ${tempPeak.median}°C. Warm ground heats the ` +
        `air, it rises, and the haze is carried up and thinned out. AQI falls to its daily low ` +
        `of ${dayMin.median} at ${hourLabel(dayMin.hour, "long")}. Even this cleanest hour is ` +
        `${cat(dayMin.median)}.`,
      range: [12, 16],
      layers: ["aqi", "traffic", "temp"],
      focusHour: dayMin.hour,
    },
    {
      id: "evening",
      kicker: hourRangeLabel(17, 23),
      title: "Everyone goes home at once",
      body:
        `At ${hourLabel(eveningTraffic.hour, "long")} the roads reach ${eveningTraffic.median}/100` +
        (trafficIsDayPeak ? ", the most congested hour of the day" : "") +
        `. As the sun sets the mixing stops, and AQI climbs back to ${eveningAqi.median} by ` +
        `${hourLabel(eveningAqi.hour, "long")}` +
        (eveningAqi.hour === dayMax.hour ? ", the worst hour of the whole day." : "."),
      range: [17, 23],
      layers: ["aqi", "traffic", "temp"],
      focusHour: eveningAqi.hour,
    },
    {
      id: "day",
      kicker: "The whole day",
      title: `${unhealthyHours} of 24 hours`,
      body:
        `On a typical winter day, ${unhealthyHours} of 24 hours are unhealthy for everyone ` +
        `(AQI above 150). ` +
        (worstAtNight
          ? `The timing shows who is in charge: the dirtiest air comes at ` +
            `${hourLabel(dayMax.hour, "long")}, when traffic is down to ${traffic[dayMax.hour].median}/100 but the air is still. ` +
            `Traffic adds to the smoke, but brick kilns, construction dust and the weather decide ` +
            `how much of it we breathe.`
          : `Traffic and smog rise together, but traffic is only one source. Brick kilns, ` +
            `construction dust and the weather matter just as much, and the overlap doesn't ` +
            `prove one causes the other.`),
      range: null,
      layers: ["aqi", "traffic", "temp"],
      focusHour: dayMax.hour,
    },
  ];
}
