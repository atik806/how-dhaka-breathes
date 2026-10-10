export function hourLabel(hour: number, style: "short" | "long" = "short"): string {
  const h = ((hour % 24) + 24) % 24;
  if (style === "long") {
    if (h === 0) return "midnight";
    if (h === 12) return "noon";
  }
  const suffix = h < 12 ? "am" : "pm";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return style === "short" ? `${twelve}${suffix}` : `${twelve} ${suffix}`;
}

export function hourRangeLabel(from: number, to: number): string {
  return `${hourLabel(from, "long")} – ${hourLabel(to, "long")}`;
}
