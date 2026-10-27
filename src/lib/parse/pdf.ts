/** One positioned piece of text from a PDF page. */
export type TextItem = { str: string; x: number; y: number; width: number };

/**
 * Rebuilds the printed lines of a monospaced receipt from positioned text pieces.
 * Pieces on the same baseline are placed at their character column, so gaps between
 * name and price survive as runs of spaces.
 */
export function linesFromTextItems(items: TextItem[]): string[] {
  const rows = new Map<number, TextItem[]>();
  for (const it of items) {
    if (!it.str) continue;
    const key = Math.round(it.y);
    let row = rows.get(key);
    if (!row) rows.set(key, (row = []));
    row.push(it);
  }
  // character cell width: width of a piece divided by its length (monospaced receipt font)
  const cells = items.filter((i) => i.str.trim().length > 1).map((i) => i.width / i.str.length);
  const cell = cells.length ? cells.sort((a, b) => a - b)[Math.floor(cells.length / 2)] : 6;
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, row]) => {
      row.sort((a, b) => a.x - b.x);
      let line = "";
      for (const it of row) {
        const col = Math.round(it.x / cell);
        if (col > line.length) line += " ".repeat(col - line.length);
        line += it.str;
      }
      return line.replace(/\s+$/, "");
    });
}

type PdfJs = typeof import("pdfjs-dist");

/** Text lines of all pages of a PDF, top to bottom, page after page. */
export async function pdfLines(data: Uint8Array, pdfjs: PdfJs, maxPages = Infinity): Promise<string[]> {
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const out: string[] = [];
  try {
    if (doc.numPages > maxPages) throw new Error("too many pages");
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const items: TextItem[] = [];
      for (const it of content.items) {
        if ("str" in it) items.push({ str: it.str, x: it.transform[4], y: it.transform[5], width: it.width });
      }
      out.push(...linesFromTextItems(items));
    }
  } finally {
    await doc.destroy();
  }
  return out;
}
