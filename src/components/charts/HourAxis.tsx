import type { ScaleLinear } from "d3-scale";
import { hourLabel } from "@/lib/format";

const TICKS = [0, 3, 6, 9, 12, 15, 18, 21];
const SPARSE_TICKS = [0, 6, 12, 18];

export function HourAxis({ x, y }: { x: ScaleLinear<number, number>; y: number }) {
  const [x0, x1] = x.range();
  // Below ~300px of plot, 3-hourly labels collide; fall back to 6-hourly.
  const ticks = x1 - x0 < 300 ? SPARSE_TICKS : TICKS;
  return (
    <g transform={`translate(0, ${y})`} className="text-[11px] fill-mute" aria-hidden>
      {ticks.map((h) => (
        <text key={h} x={x(h)} y={14} textAnchor="middle" className="tabular-nums">
          {hourLabel(h)}
        </text>
      ))}
    </g>
  );
}
