"use client";
import { useMemo } from "react";
import { CalendarHeatmap, WeekHeatmap } from "@/components/Heatmaps";
import { DataPage } from "@/components/DataPage";
import { Stat } from "@/components/Stat";
import { fmtDec } from "@/lib/format";
import { habits } from "@/lib/stats/core";
import { useBonify } from "@/lib/store/BonifyProvider";

export default function Habits() {
  const { t, lang, view } = useBonify();
  const h = useMemo(() => habits(view), [view]);
  const top = h.tripsPerWeekday.indexOf(Math.max(...h.tripsPerWeekday));
  return (
    <DataPage title={t("habits_title")}>
      <div className="stagger space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label={t("gap")} value={h.medianGapDays == null ? "–" : t("gap_value", { d: fmtDec(h.medianGapDays, lang) })} />
          <Stat label={t("checkout")} value={h.avgCheckoutSeconds == null ? "–" : t("checkout_value", { s: h.avgCheckoutSeconds })} />
          <Stat label={t("busiest")} value={t("weekdays").split(",")[top]} sub={`${h.tripsPerWeekday[top]}×`} />
        </div>
        <section className="card p-4">
          <h2 className="text-base">{t("heatmap")}</h2>
          <p className="mb-3 text-xs text-muted">{t("heatmap_hint")}</p>
          <WeekHeatmap grid={h.grid} />
        </section>
        <section className="card p-4">
          <h2 className="mb-3 text-base">{t("calendar")}</h2>
          <CalendarHeatmap days={h.days} />
        </section>
      </div>
    </DataPage>
  );
}
