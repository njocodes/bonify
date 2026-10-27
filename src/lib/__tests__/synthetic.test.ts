import { describe, expect, it } from "vitest";
import { linesFromTextItems } from "../parse/pdf";
import { parseReceipt } from "../parse";

const BON = `
        R E W E
   Musterstr. 1
   12345 Musterstadt
   UID Nr.: DE000000000
                          EUR
MILCH                    1,09 B
CREME FRAICHE            2,18 B
   2 Stk x   1,09
ERDBEERE                 3,49 B
   0,500 kg x   6,98 EUR/kg
COLA                     5,07 A
   3 Stk x   1,69
PFAND 0,25 EURO          0,75 A *
   3 Stk x   0,25
 CC 2L    gratis        -1,69 A
 --------------------------------
 SUMME          EUR     10,89
 ================================
 Geg. VISA      EUR     10,89
 Steuer %   Netto   Steuer   Brutto
 A= 19,0%    3,47     0,66     4,13
 B=  7,0%    6,05     0,42     6,47
TSE-Start:           2026-01-02T17:29:49.000
TSE-Stop:            2026-01-02T17:31:45.000
  02.01.2026          17:31         Bon-Nr.:613
  Markt:0217          Kasse:4       Bed.:432104
  Mit diesem Einkauf hast du 0,17 EUR
     REWE Bonus-Guthaben gesammelt:
  Bonus-Coupon(s)
     5% auf Erdbeeren         0,17 EUR

Aktuelles Bonus-Guthaben: 14,78 EUR
            REWE Markt GmbH
`.split("\n");

describe("parseReceipt", () => {
  const r = parseReceipt(BON)!;
  it("reads header, totals and payment", () => {
    expect(r.id).toBe("rewe-0217-2026-01-02-613");
    expect(r.market).toEqual({ id: "0217", street: "Musterstr. 1", city: "12345 Musterstadt" });
    expect(r.time).toBe("17:31");
    expect(r.totalCents).toBe(1089);
    expect(r.payments).toEqual([{ method: "VISA", cents: 1089 }]);
    expect(r.checkoutSeconds).toBe(116);
    expect(r.warnings).toEqual([]);
  });
  it("reads quantities, weights, deposit and discounts", () => {
    expect(r.items[1]).toMatchObject({ qty: 2, unitCents: 109, cents: 218 });
    expect(r.items[2]).toMatchObject({ unit: "kg", qty: 0.5, unitCents: 698 });
    expect(r.items.find((i) => i.deposit)).toMatchObject({ cents: 75 });
    expect(r.items.find((i) => i.discount)).toMatchObject({ cents: -169 });
  });
  it("reads bonus and coupons", () => {
    expect(r.bonus).toEqual({ earnedCents: 17, balanceCents: 1478, coupons: [{ name: "5% auf Erdbeeren", cents: 17 }] });
  });
  it("ignores non-REWE text", () => {
    expect(parseReceipt(["hello"])).toBeNull();
  });
});

describe("linesFromTextItems", () => {
  it("rebuilds columns from positions", () => {
    const lines = linesFromTextItems([
      { str: "MILCH", x: 12, y: 100, width: 30 },
      { str: "1,09 B", x: 120, y: 100, width: 36 },
    ]);
    expect(lines[0]).toMatch(/^\s*MILCH\s{2,}1,09 B$/);
  });
});

describe("polyfillStreamIteration", () => {
  it("lets a ReadableStream be read with for await when the browser lacks it", async () => {
    const { polyfillStreamIteration } = await import("../polyfills");
    const proto = ReadableStream.prototype as unknown as Record<symbol, unknown>;
    const original = proto[Symbol.asyncIterator];
    delete proto[Symbol.asyncIterator];
    try {
      polyfillStreamIteration();
      const stream = new ReadableStream<number>({ start(c) { c.enqueue(1); c.enqueue(2); c.close(); } });
      const seen: number[] = [];
      for await (const v of stream as unknown as AsyncIterable<number>) seen.push(v);
      expect(seen).toEqual([1, 2]);
    } finally {
      proto[Symbol.asyncIterator] = original;
    }
  });
});
