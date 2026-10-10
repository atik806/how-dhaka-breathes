import {
  AQI_ADVICE,
  AQI_CATEGORIES,
  aqiToPm25,
  cigarettesPerDay,
  PM25_PER_CIGARETTE,
} from "@/lib/aqi";
import { aqiData, SEASONS } from "@/lib/data";
import { mean } from "@/lib/plan";

const WHO_DAILY_PM25 = 15; // WHO 2021 24-hour guideline, µg/m³

function Cigarette({ fill }: { fill: number }) {
  return (
    <span
      className="relative inline-block h-2.5 w-7 overflow-hidden rounded-[2px] bg-line"
      aria-hidden
    >
      <span className="absolute inset-y-0 left-0 bg-ink/85" style={{ width: `${fill * 100}%` }} />
      {fill === 1 && <span className="absolute inset-y-0 right-0 w-2 bg-heat" />}
    </span>
  );
}

export function HealthPanel() {
  const seasons = SEASONS.map((s) => {
    const pm = mean(aqiData.seasons[s.id].map((p) => aqiToPm25(p.median)));
    return { ...s, pm, cigs: cigarettesPerDay(pm) };
  });

  return (
    <div className="mt-16 grid gap-10 lg:grid-cols-2">
      <div>
        <h3 className="font-display text-2xl text-ink">A day of breathing, in cigarettes</h3>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          A common rule of thumb (Berkeley Earth) says that breathing {PM25_PER_CIGARETTE} µg/m³ of
          PM2.5 for a day does about as much harm as smoking one cigarette. The WHO&rsquo;s daily
          guideline is {WHO_DAILY_PM25} µg/m³.
        </p>
        <ul className="mt-6 space-y-5">
          {seasons.map((s) => {
            const whole = Math.floor(s.cigs);
            const part = s.cigs - whole;
            return (
              <li key={s.id}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-ink">
                    {s.label} <span className="text-xs text-mute">({s.months})</span>
                  </span>
                  <span className="tabular-nums text-sm text-ink">
                    <span className="font-display text-2xl">{s.cigs.toFixed(1)}</span> cigarettes /
                    day
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Array.from({ length: whole }, (_, i) => (
                    <Cigarette key={i} fill={1} />
                  ))}
                  {part > 0.05 && <Cigarette fill={part} />}
                </div>
                <p className="mt-1 text-[11px] text-mute">
                  avg {Math.round(s.pm)} µg/m³, {(s.pm / WHO_DAILY_PM25).toFixed(1)}× the WHO daily
                  guideline
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="font-display text-2xl text-ink">What each level means for you</h3>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          Based on US EPA guidance. &ldquo;Sensitive groups&rdquo; means children, older adults,
          pregnant women and people with heart or lung conditions.
        </p>
        <ol className="mt-6 space-y-2">
          {AQI_CATEGORIES.map((c) => (
            <li
              key={c.name}
              className="grid grid-cols-[4.5rem_1fr] gap-3 rounded-lg border border-line bg-panel p-3"
            >
              <div>
                <span
                  className="block h-1.5 w-full rounded-full"
                  style={{ backgroundColor: c.color }}
                  aria-hidden
                />
                <span className="mt-1.5 block text-[11px] tabular-nums text-mute">
                  {c.min}–{c.max}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: c.display }}>
                  {c.name}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/75">{AQI_ADVICE[c.name]}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
