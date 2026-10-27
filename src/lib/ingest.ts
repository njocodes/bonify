import { unzipSync } from "fflate";
import { pdfLines } from "./parse/pdf";
import { parseReceipt } from "./parse";
import type { Receipt } from "./parse/types";

type PdfJs = typeof import("pdfjs-dist");

let pdfjsP: Promise<PdfJs> | null = null;
/** pdf.js runs its own worker, so reading PDFs does not block the page. */
function loadPdfJs(): Promise<PdfJs> {
  return (pdfjsP ??= import("pdfjs-dist").then((m) => {
    m.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    return m;
  }));
}

export type IngestResult = { receipts: Receipt[]; failed: string[] };

/** Flattens the picked files into PDFs; ZIP files are unpacked in memory. */
async function expand(files: File[]): Promise<{ name: string; data: Uint8Array }[]> {
  const out: { name: string; data: Uint8Array }[] = [];
  for (const f of files) {
    const buf = new Uint8Array(await f.arrayBuffer());
    if (/\.zip$/i.test(f.name) || f.type === "application/zip") {
      try {
        const entries = unzipSync(buf, { filter: (e) => /\.pdf$/i.test(e.name) && !e.name.includes("__MACOSX") });
        for (const [name, data] of Object.entries(entries)) out.push({ name: name.split("/").pop() ?? name, data });
      } catch {
        out.push({ name: f.name, data: new Uint8Array() });
      }
    } else if (/\.pdf$/i.test(f.name) || f.type === "application/pdf") {
      out.push({ name: f.name, data: buf });
    }
  }
  return out;
}

export async function ingestFiles(files: File[], onProgress?: (done: number, total: number) => void): Promise<IngestResult> {
  const pdfs = await expand(files);
  const pdfjs = await loadPdfJs();
  const receipts: Receipt[] = [];
  const failed: string[] = [];
  let done = 0;
  for (const p of pdfs) {
    try {
      const r = parseReceipt(await pdfLines(p.data, pdfjs));
      if (r && r.date && r.items.length) receipts.push(r);
      else failed.push(p.name);
    } catch {
      failed.push(p.name);
    }
    onProgress?.(++done, pdfs.length);
  }
  if (!pdfs.length && files.length) failed.push(...files.map((f) => f.name));
  return { receipts, failed };
}
