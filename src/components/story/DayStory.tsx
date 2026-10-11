"use client";

import { useEffect } from "react";
import { DayChart } from "@/components/charts/DayChart";
import { DataTable } from "@/components/charts/DataTable";
import { aqiData, temperatureData, trafficData } from "@/lib/data";
import { useActiveStep } from "@/lib/hooks";
import { buildDaySteps, STORY_SEASON } from "@/lib/story";

const steps = buildDaySteps();

export function DayStory() {
  const [ref, active] = useActiveStep<HTMLDivElement>();
  const step = steps[active];

  // The page haze tracks the air quality at the step's focus hour.
  useEffect(() => {
    const aqi = aqiData.seasons[STORY_SEASON][step.focusHour].median;
    document.documentElement.style.setProperty("--haze", String(Math.min(1, aqi / 300)));
  }, [step]);

  return (
    <section id="day" aria-labelledby="day-title" className="relative">
      <div className="mx-auto max-w-6xl px-5 pt-24 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-heat">Part one</p>
        <h2 id="day-title" className="mt-3 max-w-2xl font-display text-4xl text-ink sm:text-5xl">
          Twenty-four hours on a winter day
        </h2>
        <p className="mt-4 max-w-xl text-mute">
          Scroll through the day. Hover over the chart, or focus it and use the arrow keys, to read
          any hour.
        </p>
      </div>

      <div
        ref={ref}
        className="mx-auto grid max-w-6xl gap-x-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
      >
        <div className="sticky top-0 z-10 -mx-5 h-[56svh] bg-bg/90 px-5 pb-3 pt-4 backdrop-blur-md sm:-mx-8 sm:px-8 lg:order-2 lg:mx-0 lg:flex lg:h-svh lg:items-center lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
          <div className="h-full w-full lg:h-[min(640px,82svh)]">
            <DayChart step={step} stepIndex={active} />
          </div>
        </div>

        <ol className="relative lg:order-1">
          {steps.map((s, i) => (
            <li
              key={s.id}
              data-step={i}
              className="flex min-h-[85svh] items-center py-10 lg:min-h-svh"
            >
              <article
                className={`rounded-2xl border p-6 transition-[opacity,border-color] duration-500 motion-reduce:transition-none ${
                  i === active
                    ? "border-line-strong bg-panel opacity-100"
                    : "border-line bg-panel/60 opacity-40"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">
                  {s.kicker}
                </p>
                <h3 className="mt-2 font-display text-2xl text-ink">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-ink/80">{s.body}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <DataTable
          caption="Typical winter day in Dhaka, hourly medians (traffic: weekday)"
          columns={[
            { label: "AQI", series: aqiData.seasons[STORY_SEASON] },
            { label: "Traffic (0–100)", series: trafficData.days.weekday },
            { label: "Temp (°C)", series: temperatureData.seasons[STORY_SEASON], digits: 1 },
          ]}
        />
      </div>
    </section>
  );
}
