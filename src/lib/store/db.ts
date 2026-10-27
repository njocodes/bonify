import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { CategoryId } from "../categories";
import type { Receipt } from "../parse/types";

interface BonifyDB extends DBSchema {
  receipts: { key: string; value: Receipt };
  /** user corrections: product name as printed -> category */
  overrides: { key: string; value: CategoryId };
}

let dbp: Promise<IDBPDatabase<BonifyDB>> | null = null;

function db() {
  return (dbp ??= openDB<BonifyDB>("bonify", 1, {
    upgrade(d) {
      d.createObjectStore("receipts");
      d.createObjectStore("overrides");
    },
    // a newer tab wants to upgrade: let go of this connection instead of blocking it
    blocking() {
      void dbp?.then((d) => d.close());
      dbp = null;
    },
  }));
}

export async function loadReceipts(): Promise<Receipt[]> {
  return (await db()).getAll("receipts");
}

export async function knownIds(): Promise<Set<string>> {
  return new Set((await (await db()).getAllKeys("receipts")) as string[]);
}

export async function putReceipts(rs: Receipt[]): Promise<void> {
  if (!rs.length) return;
  const tx = (await db()).transaction("receipts", "readwrite");
  for (const r of rs) void tx.store.put(r, r.id);
  await tx.done;
}

export async function loadOverrides(): Promise<Record<string, CategoryId>> {
  const d = await db();
  const [keys, vals] = await Promise.all([d.getAllKeys("overrides"), d.getAll("overrides")]);
  return Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
}

export async function putOverride(name: string, cat: CategoryId | null): Promise<void> {
  const d = await db();
  if (cat) await d.put("overrides", cat, name);
  else await d.delete("overrides", name);
}

export async function replaceAll(rs: Receipt[], overrides: Record<string, CategoryId>): Promise<void> {
  const d = await db();
  const tx = d.transaction(["receipts", "overrides"], "readwrite");
  await Promise.all([tx.objectStore("receipts").clear(), tx.objectStore("overrides").clear()]);
  for (const r of rs) void tx.objectStore("receipts").put(r, r.id);
  for (const [k, v] of Object.entries(overrides)) void tx.objectStore("overrides").put(v, k);
  await tx.done;
}

export async function clearAll(): Promise<void> {
  await replaceAll([], {});
}
