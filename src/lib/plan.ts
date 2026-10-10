// Finds the cleanest and dirtiest outdoor windows in a typical day.

export type Window = { start: number; end: number; mean: number };

/**
 * Slides a `duration`-hour window over waking hours [from, to) and returns the
 * windows with the lowest and highest mean value.
 */
export function findWindows(values: number[], duration: number, from = 5, to = 23) {
  const windows: Window[] = [];
  for (let start = from; start + duration <= to; start++) {
    const slice = values.slice(start, start + duration);
    windows.push({
      start,
      end: start + duration,
      mean: slice.reduce((a, b) => a + b, 0) / duration,
    });
  }
  const best = windows.reduce((a, b) => (b.mean < a.mean ? b : a));
  const worst = windows.reduce((a, b) => (b.mean > a.mean ? b : a));
  return { best, worst };
}

export function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}
