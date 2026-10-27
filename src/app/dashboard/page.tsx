"use client";
import { useMemo } from "react";
import { BarsChart, ShareBars } from "@/components/charts";
import { DataPage } from "@/components/DataPage";
import { Stat } from "@/components/Stat";
import type { Key } from "@/lib/i18n/dict";
import { eur, eurShort, fmtInt, fmtMonth } from "@/lib/format";
import { overview } from "@/lib/stats/core";
import { useBonify } from "@/lib/store/BonifyProvider";

export default function Dashboard() {
  const { t, lang, view, overrides } = useBonify();
  const o = useMemo(() => overview(view, overrides), [view, overrides]);
  const weeks = o.first && o.last ? Math.max(1, (Date.parse(o.last) - Date.parse(o.first)) / (7 * 864e5)) : 1;
  const vatTotal = o.vat.reduce((s, v) => s + v.taxCents, 0);
  return (
    <DataPage title={t("nav_overview")}>
      <div className="stagger space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t("stat_spent")} value={eur(o.totalCents, lang)} sub={t("stat_per_week", { v: eur(o.totalCents / weeks, lang) })} />
          <Stat label={t("stat_trips")} value={fmtInt(o.trips, lang)} />
          <Stat label={t("stat_basket")} value={eur(o.avgBasketCents, lang)} />
          <Stat label={t("stat_items")} value={fmtInt(o.itemCount, lang)} />
        </div>
        <section className="card p-4">
          <h2 className="mb-3 text-base">{t("chart_months")}</h2>
          <BarsChart data={o.months.map((m) => ({ x: m.month, y: m.cents / 100 }))} name={t("stat_spent")} fmt={(v) => eurShort(v * 100, lang)} tickFmt={(m) => fmtMonth(m, lang)} />
        </section>
        <section className="card p-4">
          <h2 className="mb-3 text-base">{t("chart_categories")}</h2>
          <ShareBars rows={o.categories.map((c) => ({ label: t(`cat_${c.id}` as Key), value: c.cents, text: `${eur(c.cents, lang)} · ${Math.round((c.cents / Math.max(1, o.totalCents)) * 100)} %` }))} />
        </section>
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="card p-4">
            <h2 className="mb-3 text-base">{t("markets")}</h2>
            <ShareBars rows={o.markets.map((m) => ({ label: m.label || m.id, value: m.cents, text: eur(m.cents, lang), sub: t("trips_n", { n: m.trips }) }))} />
          </section>
          <section className="card p-4">
            <h2 className="mb-3 text-base">{t("payments")}</h2>
            <ShareBars rows={o.payments.map((p) => ({ label: p.method, value: p.cents, text: eur(p.cents, lang) }))} />
            <h2 className="mb-1 mt-5 text-base">{t("vat")}</h2>
            <ul className="text-sm">
              {o.vat.map((v) => (
                <li key={v.rate} className="flex justify-between py-0.5">
                  <span className="text-muted">{t("vat_rate", { r: v.rate })}</span>
                  <span className="tabular-nums">{eur(v.taxCents, lang)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted">{t("vat_inside", { v: eur(vatTotal, lang) })}</p>
          </section>
        </div>
      </div>
    </DataPage>
  );
}
