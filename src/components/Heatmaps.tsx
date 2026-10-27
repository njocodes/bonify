"use client";
import { useBonify } from "@/lib/store/BonifyProvider";
import { eur } from "@/lib/format";

const shade = (v: number, max: number) => (v <= 0 ? "var(--surface-2)" : `color-mix(in srgb, var(--accent) ${Math.round(20 + (v / max) * 80)}%, var(--surface-2))`);

/** Weekday (rows) by hour (columns) grid of trip counts. */
export function WeekHeatmap({ grid }: { grid: number[][] }) {
  const { t } = useBonify();
  const days = t("weekdays").split(",");
  const max = Math.max(1, ...grid.flat());
  let lo = 24;
  let hi = 0;
  grid.forEach((row) => row.forEach((v, h) => { if (v) { lo = Math.min(lo, h); hi = Math.max(hi, h); } }));
  if (lo > hi) { lo = 8; hi = 20; }
  const hours = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  return (
    <div role="img" aria-label={t("heatmap")}>
      <div className="grid gap-1" style={{ gridTemplateColumns: `1.6rem repeat(${hours.length}, minmax(0, 1fr))` }}>
        <span />
        {hours.map((h) => <span key={h} className="text-center text-[9px] text-muted">{h % 2 === 0 ? h : ""}</span>)}
        {grid.map((row, d) => (
          <div key={d} className="contents">
            <span className="self-center text-[10px] text-muted">{days[d]}</span>
            {hours.map((h) => <span key={h} title={`${days[d]} ${h}:00 – ${row[h]}`} className="aspect-square rounded-[3px]" style={{ background: shade(row[h], max) }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** One column per week, one row per weekday, shaded by spend. Scrolls sideways inside its card. */
export function CalendarHeatmap({ days }: { days: { date: string; cents: number }[] }) {
  const { t, lang } = useBonify();
  if (!days.length) return null;
  const byDate = new Map(days.map((d) => [d.date, d.cents]));
  const max = Math.max(1, ...days.map((d) => d.cents));
  const start = new Date(days[0].date + "T12:00:00Z");
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const end = Date.parse(days[days.length - 1].date + "T12:00:00Z");
  const weeks: { date: string; cents: number }[][] = [];
  for (const d = new Date(start); d.getTime() <= end; ) {
    const week: { date: string; cents: number }[] = [];
    for (let i = 0; i < 7; i++, d.setUTCDate(d.getUTCDate() + 1)) {
      const date = d.toISOString().slice(0, 10);
      week.push({ date, cents: byDate.get(date) ?? 0 });
    }
    weeks.push(week);
  }
  // every week is one column that shrinks to fit the card, so nothing scrolls sideways
  return (
    <div role="img" aria-label={t("calendar")} className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`, gridTemplateRows: "repeat(7, auto)", gridAutoFlow: "column" }}>
      {weeks.flat().map((d) => (
        <span key={d.date} title={`${d.date}: ${eur(d.cents, lang)}`} className="block aspect-square rounded-[2px]" style={{ background: shade(d.cents, max) }} />
      ))}
    </div>
  );
}
