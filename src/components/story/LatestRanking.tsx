import { aqiCategory, DARK_TEXT_CATEGORIES } from "@/lib/aqi";
import { latestData } from "@/lib/data";
import { hourLabel } from "@/lib/format";
import type { LatestPlace } from "@/lib/types";

/** Rows per card; with few sensors both cards show everyone. */
const MAX_ROWS = 5;

/** "10 am, 11 Oct" from a local ISO time, without converting time zones. */
function readingLabel(time: string): string {
  const day = new Date(`${time.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `${hourLabel(Number(time.slice(11, 13)), "long")}, ${day}`;
}

function RankingCard({
  title,
  subtitle,
  places,
}: {
  title: string;
  subtitle: string;
  places: LatestPlace[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
      <h3 className="font-medium text-ink">{title}</h3>
      <p className="mt-1 text-xs text-mute">{subtitle}</p>
      <table className="mt-5 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-mute">
            <th scope="col" className="w-8 pb-2 font-normal">
              #
            </th>
            <th scope="col" className="pb-2 font-normal">
              Place
            </th>
            <th scope="col" className="pb-2 text-right font-normal">
              US AQI
            </th>
          </tr>
        </thead>
        <tbody>
          {places.map((p, i) => {
            const c = aqiCategory(p.aqi);
            return (
              <tr key={p.id} className="border-t border-line/60">
                <td className="py-2.5 tabular-nums text-mute">{i + 1}</td>
                <td className="py-2.5">
                  <span className="text-ink">{p.name}</span>
                  {p.district !== "Dhaka" && (
                    <span className="ml-1.5 text-xs text-mute">{p.district}</span>
                  )}
                </td>
                <td className="py-2.5 text-right">
                  <span
                    className={`inline-block min-w-12 rounded-md px-2 py-1 text-center text-xs font-semibold tabular-nums ${DARK_TEXT_CATEGORIES.has(c.name) ? "text-black/80" : "text-white"}`}
                    style={{ backgroundColor: c.color }}
                    title={`${c.name}${p.pm25 != null ? ` · ${p.pm25} µg/m³ PM2.5` : ""}`}
                  >
                    {p.aqi}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Most polluted and cleanest places at the latest snapshot, IQAir-style. */
export function LatestRanking() {
  const { meta, places } = latestData;
  if (places.length < 2) return null;

  const n = Math.min(MAX_ROWS, places.length);
  const worst = places.slice(0, n);
  const best = [...places].reverse().slice(0, n);
  // Readings can differ by an hour; label with the most recent one.
  const newest = places.reduce((a, b) => (b.time > a.time ? b : a)).time;
  const spread = places[0].aqi - places[places.length - 1].aqi;
  const when = readingLabel(newest);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="font-display text-2xl text-ink">Place by place, at {when}</h3>
        <p className="text-xs text-mute">
          {meta.demo
            ? "Demo snapshot, not sensor readings"
            : `${places.length} sensors reporting · ${spread} AQI points between the best and worst`}
        </p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <RankingCard
          title="Most polluted"
          subtitle={`Highest hourly AQI at ${when} (Dhaka time)`}
          places={worst}
        />
        <RankingCard
          title="Cleanest"
          subtitle={`Lowest hourly AQI at ${when} (Dhaka time)`}
          places={best}
        />
      </div>
      <p className="mt-3 max-w-3xl text-[11px] leading-relaxed text-mute">
        {meta.demo
          ? "Run npm run data:latest to replace this with the latest real readings."
          : `A snapshot of the latest hourly reading from each community sensor (Smart Air Bangladesh, via OpenAQ), taken when this page was built. It is not a live feed: sensors that hadn't reported in the previous 3 hours are left out.`}
      </p>
    </div>
  );
}
