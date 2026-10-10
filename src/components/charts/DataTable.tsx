import { hourLabel } from "@/lib/format";
import type { Series } from "@/lib/types";

export type TableColumn = { label: string; series: Series; digits?: number };

/** Collapsible full-data table: the accessible twin of every chart. */
export function DataTable({ caption, columns }: { caption: string; columns: TableColumn[] }) {
  return (
    <details className="group mt-4 text-sm text-mute">
      <summary className="cursor-pointer select-none rounded underline decoration-dotted underline-offset-4 hover:text-ink">
        Show the data as a table
      </summary>
      <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-line">
        <table className="w-full border-collapse tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-panel text-ink">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-medium">
                Hour
              </th>
              {columns.map((c) => (
                <th key={c.label} scope="col" className="px-3 py-2 text-right font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns[0].series.map((p, i) => (
              <tr key={p.hour} className="border-t border-line">
                <th scope="row" className="px-3 py-1.5 text-left font-normal">
                  {hourLabel(p.hour, "long")}
                </th>
                {columns.map((c) => (
                  <td key={c.label} className="px-3 py-1.5 text-right">
                    {c.series[i].median.toFixed(c.digits ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
