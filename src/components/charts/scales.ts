import { extent } from "d3-array";
import { area, curveMonotoneX, line } from "d3-shape";
import type { ScaleLinear } from "d3-scale";
import type { Series } from "@/lib/types";

export function linePath(
  series: Series,
  x: ScaleLinear<number, number>,
  y: ScaleLinear<number, number>,
) {
  return (
    line<Series[number]>()
      .x((p) => x(p.hour))
      .y((p) => y(p.median))
      .curve(curveMonotoneX)(series) ?? ""
  );
}

export function bandPath(
  series: Series,
  x: ScaleLinear<number, number>,
  y: ScaleLinear<number, number>,
) {
  return (
    area<Series[number]>()
      .x((p) => x(p.hour))
      .y0((p) => y(p.p25))
      .y1((p) => y(p.p75))
      .curve(curveMonotoneX)(series) ?? ""
  );
}

/** A padded, rounded y-domain covering every band in the given series. */
export function niceDomain(seriesList: Series[], step: number): [number, number] {
  const values = seriesList.flatMap((s) => s.flatMap((p) => [p.p25, p.p75]));
  const [lo = 0, hi = 1] = extent(values);
  return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
}
