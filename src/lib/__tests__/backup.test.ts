import { describe, expect, it } from "vitest";
import { parseBackup } from "../backup";
import { categoryOf } from "../categories";

const item = { rawName: "MILCH", qty: 1, unit: "pc", unitCents: 99, cents: 99, taxClass: "B", deposit: false, discount: false };
const receipt = { id: "r1", store: "rewe", market: { id: "1", street: "", city: "" }, date: "2026-01-02", time: "10:00", totalCents: 99, items: [item] };

describe("parseBackup", () => {
  it("accepts a valid backup and fills missing optional fields", () => {
    const d = parseBackup(JSON.stringify({ app: "bonify", receipts: [receipt], overrides: { MILCH: "dairy" } }));
    expect(d?.receipts).toHaveLength(1);
    expect(d?.receipts[0].bonus.earnedCents).toBe(0);
    expect(d?.overrides).toEqual({ MILCH: "dairy" });
  });

  it("rejects other files and drops malformed receipts", () => {
    expect(parseBackup(JSON.stringify({ app: "x", receipts: [] }))).toBeNull();
    const d = parseBackup(JSON.stringify({ app: "bonify", receipts: [receipt, { ...receipt, id: "r2", items: [{ rawName: 1 }] }, { ...receipt, id: "r3", date: "x" }] }));
    expect(d?.receipts.map((r) => r.id)).toEqual(["r1"]);
  });

  it("keeps only known categories in overrides", () => {
    const d = parseBackup('{"app":"bonify","receipts":[],"overrides":{"A":"nope","B":"meat","__proto__":"meat"}}');
    expect(Object.keys(d!.overrides).sort()).toEqual(["B", "__proto__"]);
  });

  it("does not read inherited properties as overrides", () => {
    expect(categoryOf("constructor", {})).toBe("other");
  });
});
