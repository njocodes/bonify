"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useBonify, type ImportSummary } from "@/lib/store/BonifyProvider";

export function Dropzone() {
  const { importFiles, t, all } = useBonify();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState<{ n: number; total: number } | null>(null);
  const [res, setRes] = useState<ImportSummary | null>(null);

  async function run(list: FileList | File[]) {
    const files = [...list];
    if (!files.length) return;
    setRes(null);
    setBusy({ n: 0, total: files.length });
    try {
      setRes(await importFiles(files, (n, total) => setBusy({ n, total })));
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void run(e.dataTransfer.files);
        }}
        className={`card flex flex-col items-center gap-3 border-dashed p-8 text-center ${over ? "border-accent" : ""}`}
      >
        <p className="display text-lg">{t("import_drop")}</p>
        <button type="button" disabled={!!busy} onClick={() => input.current?.click()} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-onaccent disabled:opacity-50">
          {busy ? t("import_busy", { n: busy.n, total: busy.total }) : t("import_pick")}
        </button>
        <input ref={input} type="file" multiple accept="application/pdf,application/zip,.pdf,.zip" className="hidden" onChange={(e) => e.target.files && void run(e.target.files)} />
      </div>
      <div aria-live="polite" className="mt-3 space-y-1 text-sm">
        {res && (
          <>
            <p>{t("import_added", { n: res.added })}</p>
            {res.dupes > 0 && <p className="text-muted">{t("import_dupes", { n: res.dupes })}</p>}
            {res.failed.length > 0 && <p className="text-muted">{t("import_failed", { n: res.failed.length, names: res.failed.slice(0, 3).join(", ") })}</p>}
          </>
        )}
        {all.length > 0 && !busy && (
          <Link href="/dashboard/" className="inline-block underline underline-offset-2">
            {t("nav_overview")} →
          </Link>
        )}
      </div>
    </div>
  );
}
