import { categoryOf, type CategoryId } from "../categories";
import type { Receipt } from "../parse/types";

export type Overrides = Record<string, CategoryId>;

/** One purchased product line, with discount lines already folded into `cents`. */
export type Line = {
  rawName: string;
  category: CategoryId;
  qty: number;
  unit: "pc" | "kg";
  unitCents: number;
  /** net of discounts */
  cents: number;
  date: string;
  receiptId: string;
};

export const monthOf = (date: string) => date.slice(0, 7);
/** 0 = Monday ... 6 = Sunday */
export const weekdayOf = (date: string) => (new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7;

/** Product lines of a receipt: deposits and bags are kept out, discount lines reduce the line above. */
export function linesOf(r: Receipt, overrides: Overrides = {}): Line[] {
  const out: Line[] = [];
  for (const it of r.items) {
    if (it.deposit) continue;
    if (it.discount) {
      const prev = out[out.length - 1];
      if (prev) prev.cents += it.cents;
      continue;
    }
    out.push({
      rawName: it.rawName,
      category: categoryOf(it.rawName, overrides),
      qty: it.qty,
      unit: it.unit,
      unitCents: it.unitCents,
      cents: it.cents,
      date: r.date,
      receiptId: r.id,
    });
  }
  return out;
}

export function filterPeriod(receipts: Receipt[], from: string | null, to: string | null): Receipt[] {
  return receipts.filter((r) => (!from || r.date >= from) && (!to || r.date <= to));
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const addTo = <K>(m: Map<K, number>, k: K, v: number) => m.set(k, (m.get(k) ?? 0) + v);

export type Overview = {
  trips: number;
  totalCents: number;
  avgBasketCents: number;
  itemCount: number;
  months: { month: string; cents: number; trips: number }[];
  markets: { id: string; label: string; trips: number; cents: number }[];
  payments: { method: string; cents: number }[];
  vat: { rate: number; netCents: number; taxCents: number }[];
  categories: { id: CategoryId; cents: number }[];
  first: string | null;
  last: string | null;
};

export function overview(receipts: Receipt[], overrides: Overrides = {}): Overview {
  const months = new Map<string, { cents: number; trips: number }>();
  const markets = new Map<string, { label: string; trips: number; cents: number }>();
  const payments = new Map<string, number>();
  const vat = new Map<number, { netCents: number; taxCents: number }>();
  const cats = new Map<CategoryId, number>();
  let itemCount = 0;
  for (const r of receipts) {
    const m = months.get(monthOf(r.date)) ?? { cents: 0, trips: 0 };
    m.cents += r.totalCents;
    m.trips++;
    months.set(monthOf(r.date), m);
    const mk = markets.get(r.market.id) ?? { label: [r.market.street, r.market.city.replace(/^\d{5}\s*/, "")].filter(Boolean).join(", "), trips: 0, cents: 0 };
    mk.trips++;
    mk.cents += r.totalCents;
    markets.set(r.market.id, mk);
    for (const p of r.payments) addTo(payments, p.method, p.cents);
    for (const t of r.tax) {
      const v = vat.get(t.rate) ?? { netCents: 0, taxCents: 0 };
      v.netCents += t.netCents;
      v.taxCents += t.taxCents;
      vat.set(t.rate, v);
    }
    for (const l of linesOf(r, overrides)) {
      addTo(cats, l.category, l.cents);
      itemCount += 1;
    }
    for (const it of r.items) if (it.deposit) addTo(cats, "other", 0);
  }
  const totalCents = sum(receipts.map((r) => r.totalCents));
  const dates = receipts.map((r) => r.date).sort();
  return {
    trips: receipts.length,
    totalCents,
    avgBasketCents: receipts.length ? Math.round(totalCents / receipts.length) : 0,
    itemCount,
    months: [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v })),
    markets: [...markets.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.cents - a.cents),
    payments: [...payments.entries()].map(([method, cents]) => ({ method, cents })).sort((a, b) => b.cents - a.cents),
    vat: [...vat.entries()].map(([rate, v]) => ({ rate, ...v })).sort((a, b) => a.rate - b.rate),
    categories: [...cats.entries()].map(([id, cents]) => ({ id, cents })).filter((c) => c.cents !== 0).sort((a, b) => b.cents - a.cents),
    first: dates[0] ?? null,
    last: dates[dates.length - 1] ?? null,
  };
}

export type PricePoint = { date: string; unitCents: number; offer: boolean };

/** A purchase this much below both the purchase before and the one after counts as a one-off offer. */
const OFFER_DIP = 0.92;
/** Smallest sustained change that is reported as a price change. */
const TREND_MIN = 0.03;

/**
 * One point per day (the higher price if you shopped twice), oldest first. A price that dips well below
 * both neighbours and recovers is flagged as an offer, so it is not read as a price change.
 */
export function pricePoints(prices: { date: string; unitCents: number }[]): PricePoint[] {
  const perDay = new Map<string, number>();
  for (const p of prices) perDay.set(p.date, Math.max(perDay.get(p.date) ?? 0, p.unitCents));
  const pts = [...perDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, unitCents]) => ({ date, unitCents, offer: false }));
  for (let i = 1; i < pts.length - 1; i++) {
    if (pts[i].unitCents < OFFER_DIP * pts[i - 1].unitCents && pts[i].unitCents < OFFER_DIP * pts[i + 1].unitCents) pts[i].offer = true;
  }
  return pts;
}

export type Trend = {
  /** signed relative change, 0 when nothing changed lastingly */
  change: number;
  fromCents: number;
  toCents: number;
  fromDate: string;
  toDate: string;
  offers: number;
};

/**
 * Lasting price change of a product, ignoring offers. It compares the two earliest with the two latest
 * regular prices and takes the cautious side of each pair, so a change counts only once the new price
 * has been paid at least twice. A product whose price keeps jumping back to the old level (offers, or
 * different pack sizes under one name) shows no lasting change. Returns null with fewer than three
 * regular purchases.
 */
export function trend(prices: { date: string; unitCents: number }[]): Trend | null {
  const pts = pricePoints(prices);
  const regular = pts.filter((p) => !p.offer);
  if (regular.length < 3) return null;
  const first = regular.slice(0, 2);
  const last = regular.slice(-2);
  const offers = pts.length - regular.length;
  const hi = (a: PricePoint[]) => a.reduce((m, p) => (p.unitCents > m.unitCents ? p : m));
  const lo = (a: PricePoint[]) => a.reduce((m, p) => (p.unitCents < m.unitCents ? p : m));
  const upFrom = hi(first);
  const upTo = lo(last);
  const up = upTo.unitCents / upFrom.unitCents - 1;
  // after the rise the price must not come back down to the old level
  const rose = regular.findIndex((p) => p.unitCents >= upFrom.unitCents * (1 + TREND_MIN));
  const stayedUp = rose >= 0 && regular.slice(rose).every((p) => p.unitCents > upFrom.unitCents * (1 + TREND_MIN / 2));
  if (up >= TREND_MIN && stayedUp) return { change: up, fromCents: upFrom.unitCents, toCents: upTo.unitCents, fromDate: upFrom.date, toDate: upTo.date, offers };
  const downFrom = lo(first);
  const downTo = hi(last);
  const down = downTo.unitCents / downFrom.unitCents - 1;
  const fell = regular.findIndex((p) => p.unitCents <= downFrom.unitCents * (1 - TREND_MIN));
  const stayedDown = fell >= 0 && regular.slice(fell).every((p) => p.unitCents < downFrom.unitCents * (1 - TREND_MIN / 2));
  if (down <= -TREND_MIN && stayedDown) return { change: down, fromCents: downFrom.unitCents, toCents: downTo.unitCents, fromDate: downFrom.date, toDate: downTo.date, offers };
  return { change: 0, fromCents: regular[0].unitCents, toCents: regular[regular.length - 1].unitCents, fromDate: regular[0].date, toDate: regular[regular.length - 1].date, offers };
}

export type Product = {
  rawName: string;
  category: CategoryId;
  trips: number;
  qty: number;
  unit: "pc" | "kg";
  cents: number;
  avgUnitCents: number;
  first: string;
  last: string;
  /** one point per purchase, oldest first */
  prices: { date: string; unitCents: number }[];
  /** the same prices, one per day, with one-off offers flagged */
  points: PricePoint[];
  trend: Trend | null;
};

export function products(receipts: Receipt[], overrides: Overrides = {}): Product[] {
  const map = new Map<string, Product & { receipts: Set<string> }>();
  for (const r of receipts) {
    for (const l of linesOf(r, overrides)) {
      let p = map.get(l.rawName);
      if (!p) map.set(l.rawName, (p = { rawName: l.rawName, category: l.category, trips: 0, qty: 0, unit: l.unit, cents: 0, avgUnitCents: 0, first: l.date, last: l.date, prices: [], points: [], trend: null, receipts: new Set() }));
      p.receipts.add(l.receiptId);
      p.qty += l.qty;
      p.cents += l.cents;
      if (l.date < p.first) p.first = l.date;
      if (l.date > p.last) p.last = l.date;
      p.prices.push({ date: l.date, unitCents: l.unitCents });
    }
  }
  return [...map.values()].map(({ receipts: rs, ...p }) => {
    p.trips = rs.size;
    p.prices.sort((a, b) => a.date.localeCompare(b.date));
    p.avgUnitCents = Math.round(sum(p.prices.map((x) => x.unitCents)) / p.prices.length);
    p.points = pricePoints(p.prices);
    p.trend = trend(p.prices);
    return p;
  });
}

/**
 * Personal inflation: a chained index (first month = 100) over the products you buy.
 * Each step compares the average unit price of products bought in two consecutive months.
 */
export function priceIndex(receipts: Receipt[]): { month: string; index: number }[] {
  const raw = new Map<string, { date: string; unitCents: number }[]>();
  for (const r of receipts) {
    for (const l of linesOf(r)) {
      const arr = raw.get(l.rawName) ?? [];
      arr.push({ date: l.date, unitCents: l.unitCents });
      raw.set(l.rawName, arr);
    }
  }
  // per product and month: average of the regular (non-offer) prices
  const byProduct = new Map<string, Map<string, number[]>>();
  for (const [name, prices] of raw) {
    const pm = new Map<string, number[]>();
    for (const p of pricePoints(prices)) {
      if (p.offer) continue;
      const arr = pm.get(monthOf(p.date)) ?? [];
      arr.push(p.unitCents);
      pm.set(monthOf(p.date), arr);
    }
    byProduct.set(name, pm);
  }
  const months = [...new Set(receipts.map((r) => monthOf(r.date)))].sort();
  const avg = (xs: number[]) => sum(xs) / xs.length;
  const out: { month: string; index: number }[] = [];
  let index = 100;
  months.forEach((m, i) => {
    if (i > 0) {
      const prev = months[i - 1];
      const ratios: number[] = [];
      for (const pm of byProduct.values()) {
        const a = pm.get(prev);
        const b = pm.get(m);
        if (a && b && avg(a) > 0 && avg(b) > 0) ratios.push(Math.log(avg(b) / avg(a)));
      }
      if (ratios.length) index *= Math.exp(avg(ratios));
    }
    out.push({ month: m, index: Math.round(index * 10) / 10 });
  });
  return out;
}

export type Habits = {
  /** [weekday 0..6][hour 0..23] = number of trips */
  grid: number[][];
  days: { date: string; cents: number }[];
  medianGapDays: number | null;
  avgCheckoutSeconds: number | null;
  tripsPerWeekday: number[];
};

export function habits(receipts: Receipt[]): Habits {
  const grid = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  const perDay = new Map<string, number>();
  const checkout: number[] = [];
  for (const r of receipts) {
    const h = Number(r.time.slice(0, 2));
    if (Number.isFinite(h)) grid[weekdayOf(r.date)][h]++;
    addTo(perDay, r.date, r.totalCents);
    if (r.checkoutSeconds != null) checkout.push(r.checkoutSeconds);
  }
  const days = [...perDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, cents]) => ({ date, cents }));
  const gaps = days.slice(1).map((d, i) => (Date.parse(d.date) - Date.parse(days[i].date)) / 864e5);
  return {
    grid,
    days,
    medianGapDays: gaps.length ? median(gaps) : null,
    avgCheckoutSeconds: checkout.length ? Math.round(sum(checkout) / checkout.length) : null,
    tripsPerWeekday: grid.map((row) => sum(row)),
  };
}

export type Bonus = {
  balance: { date: string; cents: number }[];
  earnedByMonth: { month: string; cents: number }[];
  earnedCents: number;
  couponCents: number;
  couponNames: { name: string; cents: number; count: number }[];
  savingsCents: number;
  discountCents: number;
  depositCents: number;
};

export function bonus(receipts: Receipt[]): Bonus {
  const sorted = [...receipts].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const earned = new Map<string, number>();
  const coupons = new Map<string, { cents: number; count: number }>();
  let discountCents = 0;
  let depositCents = 0;
  let savingsCents = 0;
  for (const r of sorted) {
    addTo(earned, monthOf(r.date), r.bonus.earnedCents);
    for (const c of r.bonus.coupons) {
      const v = coupons.get(c.name) ?? { cents: 0, count: 0 };
      v.cents += c.cents;
      v.count++;
      coupons.set(c.name, v);
    }
    savingsCents += r.savingsCents;
    for (const it of r.items) {
      if (it.discount) discountCents += -it.cents;
      if (it.deposit) depositCents += it.cents;
    }
  }
  return {
    balance: sorted.filter((r) => r.bonus.balanceCents != null).map((r) => ({ date: r.date, cents: r.bonus.balanceCents! })),
    earnedByMonth: [...earned.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, cents]) => ({ month, cents })),
    earnedCents: sum(sorted.map((r) => r.bonus.earnedCents)),
    couponCents: sum(sorted.flatMap((r) => r.bonus.coupons.map((c) => c.cents))),
    couponNames: [...coupons.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.cents - a.cents),
    savingsCents,
    discountCents,
    depositCents,
  };
}
