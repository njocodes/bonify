import { unzipSync } from "fflate";
import { pdfLines } from "./parse/pdf";
import { polyfillStreamIteration } from "./polyfills";
import { parseReceipt } from "./parse";
import type { Receipt } from "./parse/types";

/** Limits against oversized or malicious files (a ZIP bomb would otherwise freeze the tab). */
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 5000;
const MAX_UNZIPPED_BYTES = 500 * 1024 * 1024;
const MAX_PAGES = 10;
const isPdf = (d: Uint8Array) => d[0] === 0x25 && d[1] === 0x50 && d[2] === 0x44 && d[3] === 0x46; // "%PDF"

type PdfJs = typeof import("pdfjs-dist");

let pdfjsP: Promise<PdfJs> | null = null;
/** pdf.js runs its own worker, so reading PDFs does not block the page. */
function loadPdfJs(): Promise<PdfJs> {
  polyfillStreamIteration();
  // the legacy build ships polyfills; the default one fails on Safari (e.g. async iteration of streams)
  return (pdfjsP ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((m) => {
    m.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
    return m as PdfJs;
  }));
}

export type IngestResult = { receipts: Receipt[]; failed: string[] };

/** Flattens the picked files into PDFs; ZIP files are unpacked in memory. */
async function expand(files: File[]): Promise<{ name: string; data: Uint8Array }[]> {
  const out: { name: string; data: Uint8Array }[] = [];
  for (const f of files) {
    const isZip = /\.zip$/i.test(f.name) || f.type === "application/zip";
    if (f.size > (isZip ? MAX_UNZIPPED_BYTES : MAX_PDF_BYTES)) {
      out.push({ name: f.name, data: new Uint8Array() });
      continue;
    }
    const buf = new Uint8Array(await f.arrayBuffer());
    if (/\.zip$/i.test(f.name) || f.type === "application/zip") {
      try {
        let count = 0;
        let total = 0;
        const entries = unzipSync(buf, {
          filter: (e) => {
            if (!/\.pdf$/i.test(e.name) || e.name.includes("__MACOSX")) return false;
            total += e.originalSize;
            if (++count > MAX_ZIP_ENTRIES || e.originalSize > MAX_PDF_BYTES || total > MAX_UNZIPPED_BYTES) throw new Error("ZIP too large");
            return true;
          },
        });
        for (const [name, data] of Object.entries(entries)) out.push({ name: name.split("/").pop() ?? name, data });
      } catch {
        out.push({ name: f.name, data: new Uint8Array() });
      }
    } else if (/\.pdf$/i.test(f.name) || f.type === "application/pdf") {
      out.push({ name: f.name, data: f.size > MAX_PDF_BYTES ? new Uint8Array() : buf });
    }
  }
  return out;
}

export async function ingestFiles(files: File[], onProgress?: (done: number, total: number) => void): Promise<IngestResult> {
  const pdfs = await expand(files);
  let pdfjs: PdfJs;
  try {
    pdfjs = await loadPdfJs();
  } catch (e) {
    pdfjsP = null;
    console.error("Bonify: could not load the PDF reader", e);
    return { receipts: [], failed: [`PDF reader (${e instanceof Error ? e.message : String(e)})`] };
  }
  const receipts: Receipt[] = [];
  const failed: string[] = [];
  let done = 0;
  for (const p of pdfs) {
    try {
      if (!isPdf(p.data)) throw new Error("not a PDF or too large");
      const r = parseReceipt(await pdfLines(p.data, pdfjs, MAX_PAGES));
      if (r && r.date && r.items.length) receipts.push(r);
      else failed.push(p.name);
    } catch (e) {
      // keep the reason visible: a silent failure looks the same for a broken PDF and an unsupported browser
      console.error("Bonify: could not read", p.name, e);
      failed.push(`${p.name} (${e instanceof Error ? e.message : String(e)})`);
    }
    onProgress?.(++done, pdfs.length);
  }
  if (!pdfs.length && files.length) failed.push(...files.map((f) => f.name));
  return { receipts, failed };
}
