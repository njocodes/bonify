import { CATEGORY_IDS, type CategoryId } from "./categories";
import type { Item, Receipt } from "./parse/types";

export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;
const MAX_RECEIPTS = 20000;
const MAX_ITEMS = 500;

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const str = (v: unknown): v is string => typeof v === "string";
const obj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function item(v: unknown): Item | null {
  if (!obj(v) || !str(v.rawName) || !num(v.qty) || !num(v.unitCents) || !num(v.cents)) return null;
  return {
    rawName: v.rawName,
    qty: v.qty,
    unit: v.unit === "kg" ? "kg" : "pc",
    unitCents: v.unitCents,
    cents: v.cents,
    taxClass: v.taxClass === "B" ? "B" : "A",
    deposit: v.deposit === true,
    discount: v.discount === true,
  };
}

/** Rebuilds a receipt from untrusted JSON with every field checked, or returns null. */
function receipt(v: unknown): Receipt | null {
  if (!obj(v) || !str(v.id) || !str(v.date) || !/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !Array.isArray(v.items) || v.items.length > MAX_ITEMS) return null;
  const items = v.items.map(item);
  if (items.some((i) => !i)) return null;
  const m = obj(v.market) ? v.market : {};
  const b = obj(v.bonus) ? v.bonus : {};
  const list = <T,>(x: unknown, f: (e: unknown) => T | null): T[] => (Array.isArray(x) ? x.slice(0, 100).map(f).filter((e): e is T => e !== null) : []);
  return {
    id: v.id,
    store: "rewe",
    market: { id: str(m.id) ? m.id : "", street: str(m.street) ? m.street : "", city: str(m.city) ? m.city : "" },
    date: v.date,
    time: str(v.time) && /^\d{2}:\d{2}$/.test(v.time) ? v.time : "00:00",
    checkoutSeconds: num(v.checkoutSeconds) ? v.checkoutSeconds : null,
    totalCents: num(v.totalCents) ? v.totalCents : (items as Item[]).reduce((s, i) => s + i.cents, 0),
    items: items as Item[],
    payments: list(v.payments, (p) => (obj(p) && str(p.method) && num(p.cents) ? { method: p.method, cents: p.cents } : null)),
    tax: list(v.tax, (t) =>
      obj(t) && num(t.rate) && num(t.netCents) && num(t.taxCents) && num(t.grossCents) ? { rate: t.rate, netCents: t.netCents, taxCents: t.taxCents, grossCents: t.grossCents } : null,
    ),
    bonus: {
      earnedCents: num(b.earnedCents) ? b.earnedCents : 0,
      balanceCents: num(b.balanceCents) ? b.balanceCents : null,
      coupons: list(b.coupons, (c) => (obj(c) && str(c.name) && num(c.cents) ? { name: c.name, cents: c.cents } : null)),
    },
    savingsCents: num(v.savingsCents) ? v.savingsCents : 0,
    warnings: [],
  };
}

/** Parses and validates a backup file. Returns null when it is not a Bonify backup. */
export function parseBackup(json: string): { receipts: Receipt[]; overrides: Record<string, CategoryId> } | null {
  if (json.length > MAX_BACKUP_BYTES) return null;
  const d: unknown = JSON.parse(json);
  if (!obj(d) || d.app !== "bonify" || !Array.isArray(d.receipts) || d.receipts.length > MAX_RECEIPTS) return null;
  const receipts = d.receipts.map(receipt).filter((r): r is Receipt => r !== null);
  const overrides: Record<string, CategoryId> = Object.create(null);
  if (obj(d.overrides)) {
    for (const [name, cat] of Object.entries(d.overrides)) {
      if (str(cat) && (CATEGORY_IDS as readonly string[]).includes(cat)) overrides[name] = cat as CategoryId;
    }
  }
  return { receipts, overrides: { ...overrides } };
}
