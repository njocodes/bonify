"use client";
import { useMemo } from "react";
import { AreaSeries, BarsChart, ShareBars } from "@/components/charts";
import { DataPage } from "@/components/DataPage";
import { Stat } from "@/components/Stat";
import { eur, eurShort, fmtDate, fmtMonth } from "@/lib/format";
import { bonus } from "@/lib/stats/core";
import { useBonify } from "@/lib/store/BonifyProvider";

export default function Bonus() {
  const { t, lang, view } = useBonify();
  const b = useMemo(() => bonus(view), [view]);
  const last = b.balance[b.balance.length - 1];
  const none = b.earnedCents === 0 && b.discountCents === 0 && b.savingsCents === 0 && !b.balance.length;
  return (
    <DataPage title={t("bonus_title")}>
      {none ? (
        <p className="text-sm text-muted">{t("bonus_none")}</p>
      ) : (
        <div className="stagger space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {last && <Stat label={t("bonus_balance")} value={eur(last.cents, lang)} sub={fmtDate(last.date, lang)} />}
            <Stat label={t("bonus_earned")} value={eur(b.earnedCents, lang)} />
            <Stat label={t("bonus_coupons")} value={eur(b.couponCents, lang)} />
            <Stat label={t("bonus_savings")} value={eur(b.savingsCents, lang)} />
            <Stat label={t("bonus_discounts")} value={eur(b.discountCents, lang)} />
            <Stat label={t("bonus_deposit")} value={eur(b.depositCents, lang)} />
          </div>
          {b.balance.length > 1 && (
            <section className="card p-4">
              <h2 className="mb-3 text-base">{t("bonus_balance")}</h2>
              <AreaSeries data={b.balance.map((x) => ({ x: x.date, y: x.cents / 100 }))} name={t("bonus_balance")} fmt={(v) => eurShort(v * 100, lang)} tickFmt={(d) => fmtDate(d, lang)} />
            </section>
          )}
          <section className="card p-4">
            <h2 className="mb-3 text-base">{t("bonus_per_month")}</h2>
            <BarsChart data={b.earnedByMonth.map((m) => ({ x: m.month, y: m.cents / 100 }))} name={t("bonus_earned")} fmt={(v) => eur(v * 100, lang)} tickFmt={(m) => fmtMonth(m, lang)} />
          </section>
          {b.couponNames.length > 0 && (
            <section className="card p-4">
              <h2 className="mb-3 text-base">{t("bonus_coupon_list")}</h2>
              <ShareBars rows={b.couponNames.map((c) => ({ label: c.name, value: c.cents, text: eur(c.cents, lang), sub: `${c.count}×` }))} />
            </section>
          )}
        </div>
      )}
    </DataPage>
  );
}
