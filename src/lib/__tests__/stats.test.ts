import { describe, expect, it } from "vitest";
import { categorize } from "../categories";
import { bonus, filterPeriod, habits, overview, priceIndex, products, weekdayOf } from "../stats/core";
import type { Item, Receipt } from "../parse/types";

const item = (rawName: string, cents: number, extra: Partial<Item> = {}): Item => ({ rawName, qty: 1, unit: "pc", unitCents: cents, cents, taxClass: "B", deposit: false, discount: false, ...extra });
const rec = (date: string, time: string, items: Item[], extra: Partial<Receipt> = {}): Receipt => ({
  id: `r-${date}-${time}`,
  store: "rewe",
  market: { id: "1", street: "Str. 1", city: "12345 Ort" },
  date,
  time,
  checkoutSeconds: 60,
  totalCents: items.reduce((s, i) => s + i.cents, 0),
  items,
  payments: [{ method: "VISA", cents: items.reduce((s, i) => s + i.cents, 0) }],
  tax: [{ rate: 7, netCents: 100, taxCents: 7, grossCents: 107 }],
  bonus: { earnedCents: 10, balanceCents: 10, coupons: [] },
  savingsCents: 0,
  warnings: [],
  ...extra,
});

const R = [
  rec("2026-01-05", "17:30", [item("MILCH", 100), item("COLA", 200), item("PFAND 0,25 EURO", 25, { deposit: true })]),
  rec("2026-01-09", "10:05", [item("MILCH", 110), item("COLA", 300), item("COLA gratis", -300, { discount: true })]),
  rec("2026-02-02", "18:00", [item("MILCH", 121), item("COLA", 300)]),
];

describe("categorize", () => {
  it("uses specific rules first", () => {
    expect(categorize("BIO TK BUTTERGEM")).toBe("frozen");
    expect(categorize("JA! BUTTERGEMUES")).toBe("produce");
    expect(categorize("JA! MARKENBUTTER")).toBe("dairy");
    expect(categorize("S&F ERDBEERE")).toBe("pantry");
    expect(categorize("ERDBEERE")).toBe("produce");
    expect(categorize("UNBEKANNT")).toBe("other");
  });
});

describe("stats", () => {
  it("summarises trips, months and discounts", () => {
    const o = overview(R);
    expect(o.trips).toBe(3);
    expect(o.months.map((m) => m.month)).toEqual(["2026-01", "2026-02"]);
    expect(o.totalCents).toBe(R.reduce((s, r) => s + r.totalCents, 0));
    // the "gratis" line reduces COLA instead of being its own product
    expect(products(R).find((p) => p.rawName === "COLA")!.cents).toBe(500);
    expect(products(R).some((p) => p.rawName === "COLA gratis")).toBe(false);
  });
  it("filters by period", () => {
    expect(filterPeriod(R, "2026-02-01", null)).toHaveLength(1);
  });
  it("chains a price index", () => {
    const idx = priceIndex(R);
    expect(idx[0]).toEqual({ month: "2026-01", index: 100 });
    expect(idx[1].index).toBeGreaterThan(100);
  });
  it("finds habits", () => {
    expect(weekdayOf("2026-01-05")).toBe(0); // Monday
    const h = habits(R);
    expect(h.grid[0][17]).toBe(1);
    expect(h.medianGapDays).toBe(14);
    expect(h.avgCheckoutSeconds).toBe(60);
  });
  it("adds up bonus and deposits", () => {
    const b = bonus(R);
    expect(b.earnedCents).toBe(30);
    expect(b.depositCents).toBe(25);
    expect(b.discountCents).toBe(300);
  });
});
