"use client";
import { useMemo, useState } from "react";
import { LinesChart } from "@/components/charts";
import { DataPage } from "@/components/DataPage";
import { Segmented } from "@/components/Segmented";
import { CATEGORY_IDS, type CategoryId } from "@/lib/categories";
import type { Key } from "@/lib/i18n/dict";
import { eur, fmtDate, pct } from "@/lib/format";
import { priceIndex, products, type Product } from "@/lib/stats/core";
import { useBonify } from "@/lib/store/BonifyProvider";

type Sort = "spend" | "trips" | "price";

/** Lasting price change without one-off offers, or null when there are too few purchases to tell. */
const change = (p: Product) => (p.trend ? p.trend.change : null);

export default function Products() {
  const { t, lang, view, overrides, setOverride } = useBonify();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("spend");
  const [sel, setSel] = useState<string | null>(null);
  const all = useMemo(() => products(view, overrides), [view, overrides]);
  const index = useMemo(() => priceIndex(view), [view]);
  const list = useMemo(() => {
    const f = all.filter((p) => p.rawName.toLowerCase().includes(q.trim().toLowerCase()));
    const key = (p: Product) => (sort === "spend" ? p.cents : sort === "trips" ? p.trips : Math.abs(change(p) ?? 0));
    return f.sort((a, b) => key(b) - key(a));
  }, [all, q, sort]);
  const rising = useMemo(() => all.filter((p) => p.trend && p.trend.change > 0).sort((a, b) => b.trend!.change - a.trend!.change).slice(0, 10), [all]);
  const offerCount = useMemo(() => all.reduce((n, p) => n + (p.trend ? p.trend.offers : 0), 0), [all]);
  const current = sel ? all.find((p) => p.rawName === sel) : null;
  const unitLabel = (p: Product) => (p.unit === "kg" ? t("per_kg") : t("per_piece"));

  return (
    <DataPage title={t("products_title")}>
      {current ? (
        <div className="space-y-4">
          <button type="button" onClick={() => setSel(null)} className="text-sm text-muted underline underline-offset-2">
            ← {t("back")}
          </button>
          <section className="card p-4">
            <h2 className="text-xl">{current.rawName}</h2>
            <p className="text-xs text-muted">{t("first_last", { a: fmtDate(current.first, lang), b: fmtDate(current.last, lang) })}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><dt className="text-xs text-muted">{t("bought_n", { n: current.trips })}</dt><dd className="display text-lg tabular-nums">{current.unit === "kg" ? `${current.qty.toFixed(2)} kg` : `${current.qty}×`}</dd></div>
              <div><dt className="text-xs text-muted">{t("total_spent")}</dt><dd className="display text-lg tabular-nums">{eur(current.cents, lang)}</dd></div>
              <div><dt className="text-xs text-muted">{t("avg_price")} {unitLabel(current)}</dt><dd className="display text-lg tabular-nums">{eur(current.avgUnitCents, lang)}</dd></div>
              <div><dt className="text-xs text-muted">{t("price_change")}</dt><dd className="display text-lg tabular-nums">{change(current) == null ? "–" : pct(change(current)!, lang)}</dd></div>
            </dl>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-muted">{t("category")}</span>
              <select value={current.category} onChange={(e) => void setOverride(current.rawName, e.target.value as CategoryId)} className="rounded-lg border border-line bg-surface2 px-2 py-1">
                {CATEGORY_IDS.map((c) => <option key={c} value={c}>{t(`cat_${c}` as Key)}</option>)}
              </select>
            </label>
          </section>
          <section className="card p-4">
            <h2 className="text-base">{t("price_history")}</h2>
            <p className="mb-3 text-sm text-muted">
              {!current.trend
                ? t("trend_need")
                : current.trend.change > 0
                  ? t("trend_up", { a: eur(current.trend.fromCents, lang), b: eur(current.trend.toCents, lang) })
                  : current.trend.change < 0
                    ? t("trend_down", { a: eur(current.trend.fromCents, lang), b: eur(current.trend.toCents, lang) })
                    : t("trend_flat")}
              {current.trend && current.trend.offers > 0 && ` · ${t("offers_note", { n: current.trend.offers })}`}
            </p>
            <LinesChart step data={current.points.map((p) => ({ x: p.date, y: p.unitCents / 100, o: p.offer }))} name={`${t("avg_price")} ${unitLabel(current)}`} fmt={(v) => eur(v * 100, lang)} tickFmt={(d) => fmtDate(d, lang)} />
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="text-base">{t("index_title")}</h2>
            <p className="mb-3 text-xs text-muted">{t("index_hint")}</p>
            {index.length > 1 ? <LinesChart data={index.map((i) => ({ x: i.month, y: i.index }))} name={t("index_title")} fmt={(v) => v.toFixed(0)} tickFmt={(m) => m.slice(2)} /> : <p className="text-sm text-muted">{t("index_need")}</p>}
          </section>
          <section className="card p-4">
            <h2 className="text-base">{t("rising_title")}</h2>
            <p className="mb-3 text-xs text-muted">{t("rising_hint")}</p>
            {rising.length === 0 ? (
              <p className="text-sm text-muted">{t("rising_none")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {rising.map((p) => (
                  <li key={p.rawName}>
                    <button type="button" onClick={() => setSel(p.rawName)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left">
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{p.rawName}</span>
                        <span className="block text-xs text-muted">{t("rising_from_to", { a: eur(p.trend!.fromCents, lang), b: eur(p.trend!.toCents, lang) })} {p.unit === "kg" ? t("per_kg") : ""}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">{pct(p.trend!.change, lang)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {offerCount > 0 && <p className="mt-3 text-xs text-muted">{t("offers_note", { n: offerCount })}</p>}
          </section>
          <div className="flex flex-wrap items-center gap-3">
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="min-w-0 flex-1 rounded-full border border-line bg-surface2 px-4 py-2 text-sm" />
            <Segmented size="sm" value={sort} onChange={setSort} options={[["spend", t("sort_spend")], ["trips", t("sort_trips")], ["price", t("sort_price")]]} />
          </div>
          <ul className="card divide-y divide-line">
            {list.slice(0, 200).map((p) => {
              const c = change(p);
              return (
                <li key={p.rawName}>
                  <button type="button" onClick={() => setSel(p.rawName)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{p.rawName}</span>
                      <span className="block text-xs text-muted">{t("bought_n", { n: p.trips })} · {t(`cat_${p.category}` as Key)}</span>
                    </span>
                    <span className="shrink-0 text-right text-sm tabular-nums">
                      {eur(p.cents, lang)}
                      {c != null && <span className="block text-xs text-muted">{pct(c, lang)}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </DataPage>
  );
}
