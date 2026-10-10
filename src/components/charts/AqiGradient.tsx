import type { ScaleLinear } from "d3-scale";
import { AQI_CATEGORIES } from "@/lib/aqi";

/** Vertical gradient that colors an AQI stroke by its EPA category, with hard stops. */
export function AqiGradient({ id, y }: { id: string; y: ScaleLinear<number, number> }) {
  const [lo, hi] = y.domain();
  const span = hi - lo;
  const offset = (v: number) => `${Math.min(100, Math.max(0, ((v - lo) / span) * 100))}%`;
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={y(lo)} y2={y(hi)}>
      {AQI_CATEGORIES.flatMap((c) => [
        <stop key={`${c.name}-a`} offset={offset(c.min - 0.5)} stopColor={c.display} />,
        <stop key={`${c.name}-b`} offset={offset(c.max + 0.5)} stopColor={c.display} />,
      ])}
    </linearGradient>
  );
}

/** Faint horizontal EPA category bands behind an AQI plot. */
export function AqiBands({
  y,
  x0,
  x1,
  opacity = 0.07,
}: {
  y: ScaleLinear<number, number>;
  x0: number;
  x1: number;
  opacity?: number;
}) {
  const [lo, hi] = y.domain();
  return (
    <g aria-hidden>
      {AQI_CATEGORIES.filter((c) => c.max > lo && c.min < hi).map((c) => {
        const top = y(Math.min(hi, c.max));
        const bottom = y(Math.max(lo, c.min));
        return (
          <rect
            key={c.name}
            x={x0}
            width={x1 - x0}
            y={top}
            height={bottom - top}
            fill={c.color}
            opacity={opacity}
          />
        );
      })}
    </g>
  );
}
