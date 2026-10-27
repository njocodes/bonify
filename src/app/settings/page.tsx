"use client";
import { useMemo, useRef, useState } from "react";
import { Segmented } from "@/components/Segmented";
import { CATEGORY_IDS, type CategoryId } from "@/lib/categories";
import type { Key, Lang } from "@/lib/i18n/dict";
import { products } from "@/lib/stats/core";
import { useBonify, type Theme } from "@/lib/store/BonifyProvider";

export default function Settings() {
  const { t, all, overrides, setOverride, settings, setSettings, exportBackup, importBackup, deleteAll } = useBonify();
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const list = useMemo(() => products(all, overrides).sort((a, b) => a.rawName.localeCompare(b.rawName)), [all, overrides]);
  const shown = list.filter((p) => p.rawName.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 100);

  function download() {
    const url = URL.createObjectURL(new Blob([exportBackup()], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `bonify-backup-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl">{t("settings_title")}</h1>
      <section className="card flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{t("language")}</span>
          <Segmented size="sm" value={settings.lang} onChange={(lang: Lang) => setSettings({ lang })} options={[["de", "Deutsch"], ["en", "English"]]} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{t("theme")}</span>
          <Segmented size="sm" value={settings.theme} onChange={(theme: Theme) => setSettings({ theme })} options={[["classic", t("theme_classic")], ["clean", t("theme_clean")]]} />
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-base">{t("data")}</h2>
        <p className="text-xs text-muted">{t("receipts_n", { n: all.length })}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <button type="button" onClick={download} disabled={!all.length} className="rounded-full border border-line px-4 py-1.5 disabled:opacity-40">{t("backup_export")}</button>
          <button type="button" onClick={() => file.current?.click()} className="rounded-full border border-line px-4 py-1.5">{t("backup_import")}</button>
          <button type="button" disabled={!all.length} onClick={() => { if (confirm(t("delete_confirm"))) void deleteAll(); }} className="rounded-full border border-line px-4 py-1.5 text-red-500 disabled:opacity-40">{t("delete_all")}</button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setMsg((await importBackup(await f.text())) ? t("backup_ok") : t("backup_bad"));
            e.target.value = "";
          }} />
        </div>
        {msg && <p role="status" className="mt-2 text-sm text-muted">{msg}</p>}
      </section>

      {list.length > 0 && (
        <section className="card p-4">
          <h2 className="text-base">{t("categories_title")}</h2>
          <p className="mb-3 text-xs text-muted">{t("categories_hint")}</p>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="mb-3 w-full rounded-full border border-line bg-surface2 px-4 py-2 text-sm" />
          <ul className="divide-y divide-line">
            {shown.map((p) => (
              <li key={p.rawName} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate">{p.rawName}</span>
                <select value={p.category} aria-label={p.rawName} onChange={(e) => void setOverride(p.rawName, e.target.value as CategoryId)} className="shrink-0 rounded-lg border border-line bg-surface2 px-2 py-1 text-xs">
                  {CATEGORY_IDS.map((c) => <option key={c} value={c}>{t(`cat_${c}` as Key)}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
