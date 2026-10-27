"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { useBonify, type Period } from "@/lib/store/BonifyProvider";
import { Segmented } from "./Segmented";

/** Shared page frame: title, import shortcut, period filter, loading and empty states. */
export function DataPage({ title, children }: { title: string; children: ReactNode }) {
  const { ready, all, view, settings, setSettings, t } = useBonify();
  const periods: [Period, string][] = [
    ["all", t("period_all")],
    ["year", t("period_year")],
    ["90d", t("period_90d")],
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">{title}</h1>
        {all.length > 0 && <Segmented size="sm" label={t("period_label")} value={settings.period} options={periods} onChange={(period) => setSettings({ period })} />}
      </div>
      <div className="mt-5">
        {!ready ? (
          <p className="text-sm text-muted">{t("loading")}</p>
        ) : all.length === 0 ? (
          <p className="text-sm text-muted">
            {t("emptyApp")}{" "}
            <Link href="/" className="underline underline-offset-2">
              {t("nav_import")}
            </Link>
          </p>
        ) : view.length === 0 ? (
          <p className="text-sm text-muted">{t("empty")}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
