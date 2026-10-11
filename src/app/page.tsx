import { HourGrid } from "@/components/charts/HourGrid";
import { NeighbourhoodChart } from "@/components/charts/NeighbourhoodChart";
import { YearHeatmap } from "@/components/charts/YearHeatmap";
import { ChapterNav } from "@/components/story/ChapterNav";
import { DayStory } from "@/components/story/DayStory";
import { HealthPanel } from "@/components/story/HealthPanel";
import { Hero } from "@/components/story/Hero";
import { Methodology } from "@/components/story/Methodology";
import { Planner } from "@/components/story/Planner";
import { SeasonStory } from "@/components/story/SeasonStory";
import { SectionHeader } from "@/components/story/SectionHeader";
import {
  ALL_DEMO,
  aqiData,
  monthsData,
  NEIGHBOURHOOD_SEASONS,
  neighbourhoodData,
  periodLabel,
} from "@/lib/data";
import { mean } from "@/lib/plan";
import { seasonStats } from "@/lib/story";

const SECTION = "mx-auto max-w-6xl scroll-mt-8 px-5 py-24 sm:px-8";

export default function Home() {
  const winter = seasonStats("winter");
  const monthMeans = monthsData.months.map((m) => ({
    label: m.label,
    avg: Math.round(mean(m.aqi)),
  }));
  const dirtiest = monthMeans.reduce((a, b) => (b.avg > a.avg ? b : a));
  const cleanest = monthMeans.reduce((a, b) => (b.avg < a.avg ? b : a));

  // Neighbourhood intro uses the chart's default (first available) season.
  const hoodSeason = NEIGHBOURHOOD_SEASONS[0];
  const ranked = hoodSeason
    ? neighbourhoodData.areas
        .flatMap((a) => {
          const aqi = a.seasons[hoodSeason.id]?.aqi;
          return aqi ? [{ name: a.name, avg: Math.round(mean(aqi)) }] : [];
        })
        .sort((a, b) => a.avg - b.avg)
    : [];
  const hoodsDemo = neighbourhoodData.meta.demo;
  const cityMeasured = aqiData.meta.citySource === "embassy";

  return (
    <main id="main">
      <ChapterNav />
      <Hero />
      <DayStory />
      <SeasonStory />

      <section id="year" aria-labelledby="year-title" className={SECTION}>
        <SectionHeader part="Part three" id="year-title" title="The year in one picture">
          Every row is a month and every column an hour. Read across a row for the daily rhythm, and
          down a column to see the seasons change. {dirtiest.label} is the worst month (average AQI{" "}
          {dirtiest.avg}) and {cleanest.label} the cleanest ({cleanest.avg}), a{" "}
          {Math.round(dirtiest.avg / cleanest.avg)}× difference.
          {!aqiData.meta.demo && (
            <>
              {" "}
              {cityMeasured ? "Measured at the US Embassy monitor" : "Modelled by Open-Meteo"},{" "}
              {periodLabel(aqiData.meta.period)}.
            </>
          )}
        </SectionHeader>
        <div className="mt-10">
          <YearHeatmap />
        </div>
      </section>

      <section id="neighbourhoods" aria-labelledby="hoods-title" className={SECTION}>
        <SectionHeader part="Part four" id="hoods-title" title="Not every street breathes the same">
          The same weather sits over the whole city, but what happens on the ground differs.
          {ranked.length >= 2 && hoodSeason && (
            <>
              {" "}
              In the {hoodSeason.label.toLowerCase()} months, {ranked[ranked.length - 1].name}{" "}
              averaged an AQI of {ranked[ranked.length - 1].avg} and {ranked[0].name}{" "}
              {ranked[0].avg}, a{" "}
              {Math.round((ranked[ranked.length - 1].avg / ranked[0].avg - 1) * 100)}% gap between
              places a few kilometres apart.
            </>
          )}
        </SectionHeader>
        <p className="mt-3 max-w-2xl text-xs text-mute">
          {hoodsDemo
            ? "These neighbourhood profiles are illustrative, not station readings."
            : `Measured by ${neighbourhoodData.areas.filter((a) => Object.keys(a.seasons).length > 0).length} low-cost community sensors (Smart Air Bangladesh, via OpenAQ), ${periodLabel(neighbourhoodData.meta.period)}. Most were installed in early 2026, so winter isn't covered yet. Low-cost sensors can read high in humid air, so compare areas with each other rather than with the citywide figures.`}
        </p>
        <div className="mt-12">
          <NeighbourhoodChart />
        </div>
      </section>

      <section id="health" aria-labelledby="health-title" className={SECTION}>
        <SectionHeader part="Part five" id="health-title" title="What it means to breathe it">
          Each square below is one hour of a typical day, colored by the US EPA category. On a
          typical winter day, {winter.unhealthyHours} of 24 hours are unhealthy for everyone, not
          only children, older people and those with asthma.
        </SectionHeader>
        <div className="mt-10">
          <HourGrid />
        </div>
        <HealthPanel />
      </section>

      <section id="plan" aria-labelledby="plan-title" className={SECTION}>
        <SectionHeader part="Part six" id="plan-title" title="Plan your time outside">
          You can&rsquo;t change the air, but you can change when you breathe it. Pick a month and
          how long you&rsquo;ll be out, and we&rsquo;ll find the cleanest and the worst window in a
          typical day.
        </SectionHeader>
        <div className="mt-10">
          <Planner />
        </div>
      </section>

      <Methodology />

      <footer className="mx-auto max-w-6xl px-5 pb-12 text-xs text-mute sm:px-8">
        {ALL_DEMO
          ? "How Dhaka Breathes is a data story built with demo data."
          : "Air quality: US Embassy Dhaka monitor and Smart Air Bangladesh sensors via OpenAQ. Weather: Open-Meteo. Traffic: estimated index."}
      </footer>
    </main>
  );
}
