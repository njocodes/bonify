"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CategoryId } from "../categories";
import { translate, type Key, type Lang } from "../i18n/dict";
import { ingestFiles } from "../ingest";
import type { Receipt } from "../parse/types";
import { filterPeriod } from "../stats/core";
import * as store from "./db";

export type Period = "all" | "year" | "90d";
export type Theme = "classic" | "clean";
export type Settings = { lang: Lang; theme: Theme; period: Period };
export type ImportSummary = { added: number; dupes: number; failed: string[] };

type Ctx = {
  ready: boolean;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  lang: Lang;
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
  /** every stored receipt */
  all: Receipt[];
  /** receipts inside the selected period */
  view: Receipt[];
  overrides: Record<string, CategoryId>;
  setOverride: (name: string, cat: CategoryId | null) => Promise<void>;
  importFiles: (files: File[], onProgress?: (done: number, total: number) => void) => Promise<ImportSummary>;
  exportBackup: () => string;
  importBackup: (json: string) => Promise<boolean>;
  deleteAll: () => Promise<void>;
  error: string | null;
};

const KEY = "bonify.settings";
const THEMES: Theme[] = ["classic", "clean"];

function defaults(): Settings {
  const de = typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("de");
  return { lang: de ? "de" : "en", theme: "classic", period: "all" };
}

function readSettings(): Settings {
  const d = defaults();
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Settings>;
    return {
      lang: s.lang === "de" || s.lang === "en" ? s.lang : d.lang,
      theme: THEMES.includes(s.theme as Theme) ? (s.theme as Theme) : d.theme,
      period: s.period === "year" || s.period === "90d" ? s.period : "all",
    };
  } catch {
    return d;
  }
}

const BonifyCtx = createContext<Ctx | null>(null);

export function useBonify(): Ctx {
  const c = useContext(BonifyCtx);
  if (!c) throw new Error("useBonify outside provider");
  return c;
}

/** Date range of a period, relative to the newest receipt so old exports still show something. */
function range(period: Period, all: Receipt[]): [string | null, string | null] {
  if (period === "all" || !all.length) return [null, null];
  const last = all.reduce((m, r) => (r.date > m ? r.date : m), "");
  if (period === "year") return [`${last.slice(0, 4)}-01-01`, null];
  const d = new Date(last + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 90);
  return [d.toISOString().slice(0, 10), null];
}

export function BonifyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(defaults);
  const [all, setAll] = useState<Receipt[]>([]);
  const [overrides, setOverrides] = useState<Record<string, CategoryId>>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // saved settings come from localStorage, which only exists in the browser (not while pre-rendering)
    void Promise.resolve().then(() => setSettingsState(readSettings()));
    store
      .loadReceipts()
      .then(async (rs) => {
        setAll(rs.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
        setOverrides(await store.loadOverrides());
      })
      .catch(() => setError("error_db"))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    document.documentElement.lang = settings.lang;
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.lang, settings.theme]);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((s) => {
      const next = { ...s, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const t = useCallback((key: Key, vars?: Record<string, string | number>) => translate(settings.lang, key, vars), [settings.lang]);

  const view = useMemo(() => {
    const [from, to] = range(settings.period, all);
    return filterPeriod(all, from, to);
  }, [all, settings.period]);

  const importFiles = useCallback<Ctx["importFiles"]>(
    async (files, onProgress) => {
      const { receipts, failed } = await ingestFiles(files, onProgress);
      const known = new Set(all.map((r) => r.id));
      const fresh: Receipt[] = [];
      for (const r of receipts) {
        if (known.has(r.id)) continue;
        known.add(r.id);
        fresh.push(r);
      }
      try {
        await store.putReceipts(fresh);
      } catch {
        setError("error_db");
      }
      setAll((prev) => [...prev, ...fresh].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
      return { added: fresh.length, dupes: receipts.length - fresh.length, failed };
    },
    [all],
  );

  const setOverride = useCallback(async (name: string, cat: CategoryId | null) => {
    setOverrides((o) => {
      const next = { ...o };
      if (cat) next[name] = cat;
      else delete next[name];
      return next;
    });
    await store.putOverride(name, cat).catch(() => setError("error_db"));
  }, []);

  const exportBackup = useCallback(() => JSON.stringify({ app: "bonify", version: 1, receipts: all, overrides }), [all, overrides]);

  const importBackup = useCallback(async (json: string) => {
    try {
      const d = JSON.parse(json) as { app?: string; receipts?: Receipt[]; overrides?: Record<string, CategoryId> };
      if (d.app !== "bonify" || !Array.isArray(d.receipts)) return false;
      const rs = d.receipts.filter((r) => r && typeof r.id === "string" && typeof r.date === "string" && Array.isArray(r.items));
      await store.replaceAll(rs, d.overrides ?? {});
      setAll(rs.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
      setOverrides(d.overrides ?? {});
      return true;
    } catch {
      return false;
    }
  }, []);

  const deleteAll = useCallback(async () => {
    await store.clearAll().catch(() => {});
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setAll([]);
    setOverrides({});
    setSettingsState(defaults());
  }, []);

  const value = useMemo<Ctx>(
    () => ({ ready, t, lang: settings.lang, settings, setSettings, all, view, overrides, setOverride, importFiles, exportBackup, importBackup, deleteAll, error }),
    [ready, t, settings, setSettings, all, view, overrides, setOverride, importFiles, exportBackup, importBackup, deleteAll, error],
  );
  return <BonifyCtx.Provider value={value}>{children}</BonifyCtx.Provider>;
}

