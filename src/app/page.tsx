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
import { monthsData, neighbourhoodData } from "@/lib/data";
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
  const areas = [...neighbourhoodData.areas].sort((a, b) => a.factor - b.factor);
  const spread = Math.round((areas[areas.length - 1].factor / areas[0].factor - 1) * 100);

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
        </SectionHeader>
        <div className="mt-10">
          <YearHeatmap />
        </div>
      </section>

      <section id="neighbourhoods" aria-labelledby="hoods-title" className={SECTION}>
        <SectionHeader part="Part four" id="hoods-title" title="Not every street breathes the same">
          The same weather sits over the whole city, but what happens on the ground differs. Leafy{" "}
          {areas[0].name} and industrial {areas[areas.length - 1].name} differ by about {spread}% on
          a typical day, and the gap widens at rush hour on busy corridors.
        </SectionHeader>
        <p className="mt-3 max-w-2xl text-xs text-mute">
          These neighbourhood profiles are illustrative, not station readings.
        </p>
        <div className="mt-12">
          <NeighbourhoodChart />
        </div>
      </section>

      <section id="health" aria-labelledby="health-title" className={SECTION}>
        <SectionHeader part="Part five" id="health-title" title="What it means to breathe it">
          Each square below is one hour of a typical day, colored by the US EPA category. On a
          winter day in this dataset, {winter.unhealthyHours} of 24 hours are unhealthy for
          everyone, not only children, older people and those with asthma.
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
        How Dhaka Breathes is a data story built with demo data.
      </footer>
    </main>
  );
}
