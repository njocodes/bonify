import type { Item, Receipt } from "./types";

/** "1.234,56" or "12,30" to cents */
const cents = (s: string) => Math.round(parseFloat(s.replace(/\./g, "").replace(",", ".")) * 100);
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

const POSITION = /^(.+?)\s{2,}(-?\d+,\d{2}) ([AB])( \*)?$/;
const PIECES = /^(\d+) Stk x\s+(\d+,\d{2})$/;
const WEIGHT = /^(\d+,\d{3}) kg x\s+(\d+,\d{2}) EUR\/kg$/;

/** True when the lines look like a REWE eBon (the market footer or the bonus text is always there). */
export function isRewe(lines: string[]): boolean {
  return lines.some((l) => /REWE Markt GmbH|R E W E|REWE Bonus/.test(l)) && lines.some((l) => /^\s*SUMME\s+EUR/.test(l));
}

/**
 * Parses the lines of one REWE eBon. Personal payment data (card number, terminal and
 * trace ids, operator id, TSE signature) is never read.
 */
export function parseRewe(lines: string[]): Receipt {
  const warnings: string[] = [];
  const L = lines.map((l) => l.replace(/\s+$/, ""));

  // header: everything above the lone "EUR" column title
  const eurAt = L.findIndex((l) => l.trim() === "EUR");
  const head = L.slice(0, Math.max(eurAt, 0)).map((l) => l.trim()).filter(Boolean);
  const addr = head.filter((l) => !/^(R E W E|Tel\.|UID)/.test(l));
  const cityAt = addr.findIndex((l) => /^\d{5}\s/.test(l));
  const city = cityAt >= 0 ? addr[cityAt] : "";
  const street = cityAt > 0 ? addr[cityAt - 1] : "";

  // items: between the "EUR" title and the dashed rule before SUMME
  const items: Item[] = [];
  let i = eurAt + 1;
  for (; i < L.length && !/^\s*-{10,}/.test(L[i]); i++) {
    const line = L[i];
    const t = line.trim();
    if (!t) continue;
    const pos = POSITION.exec(t);
    if (pos) {
      const price = cents(pos[2]);
      const rawName = clean(pos[1]);
      items.push({
        rawName,
        qty: 1,
        unit: "pc",
        unitCents: price,
        cents: price,
        taxClass: pos[3] as "A" | "B",
        deposit: /^PFAND\b/.test(rawName),
        discount: price < 0,
      });
      continue;
    }
    const last = items[items.length - 1];
    const pcs = PIECES.exec(t);
    const kg = WEIGHT.exec(t);
    if (last && pcs) {
      last.qty = Number(pcs[1]);
      last.unitCents = cents(pcs[2]);
    } else if (last && kg) {
      last.qty = Number(kg[1].replace(",", "."));
      last.unit = "kg";
      last.unitCents = cents(kg[2]);
    } else {
      warnings.push(`unrecognised line: ${t}`);
    }
  }

  const find = (re: RegExp) => {
    for (const l of L) {
      const m = re.exec(l);
      if (m) return m;
    }
    return null;
  };

  const sum = find(/^\s*SUMME\s+EUR\s+(\d+,\d{2})/);
  const totalCents = sum ? cents(sum[1]) : items.reduce((s, it) => s + it.cents, 0);
  if (!sum) warnings.push("no SUMME line");
  const itemSum = items.reduce((s, it) => s + it.cents, 0);
  if (sum && itemSum !== totalCents) warnings.push(`items sum ${itemSum} differs from total ${totalCents}`);

  const payments = L.flatMap((l) => {
    const m = /^\s*Geg\.\s+(.+?)\s+EUR\s+(-?\d+,\d{2})/.exec(l);
    return m ? [{ method: clean(m[1]), cents: cents(m[2]) }] : [];
  });

  const tax = L.flatMap((l) => {
    const m = /^\s*[AB]=\s*(\d+),\d%\s+(-?\d+,\d{2})\s+(-?\d+,\d{2})\s+(-?\d+,\d{2})/.exec(l);
    return m ? [{ rate: Number(m[1]), netCents: cents(m[2]), taxCents: cents(m[3]), grossCents: cents(m[4]) }] : [];
  });

  const when = find(/^\s*(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})\s+Bon-Nr\.:(\d+)/);
  const mk = find(/Markt:(\d+)\s+Kasse:(\d+)/);
  if (!when) warnings.push("no date line");
  const date = when ? `${when[3]}-${when[2]}-${when[1]}` : "";
  const time = when ? `${when[4]}:${when[5]}` : "";
  const bonNo = when ? when[6] : "";
  const marketId = mk ? mk[1] : "";

  const tseStart = find(/TSE-Start:\s+(\S+)/);
  const tseStop = find(/TSE-Stop:\s+(\S+)/);
  const secs = tseStart && tseStop ? (Date.parse(tseStop[1] + "Z") - Date.parse(tseStart[1] + "Z")) / 1000 : NaN;

  // bonus block
  const earned = find(/Mit diesem Einkauf hast du (\d+,\d{2}) EUR/);
  const balance = find(/Aktuelles Bonus-Guthaben:\s+(\d+,\d{2}) EUR/);
  const coupons: { name: string; cents: number }[] = [];
  const cAt = L.findIndex((l) => /Bonus-Coupon\(s\)/.test(l));
  if (cAt >= 0) {
    for (let j = cAt + 1; j < L.length; j++) {
      const m = /^\s+(.+?)\s{2,}(\d+,\d{2}) EUR$/.exec(L[j]);
      if (!m) break;
      coupons.push({ name: clean(m[1]), cents: cents(m[2]) });
    }
  }

  // "Deine zusätzlichen Vorteile heute": the Summe line below it
  let savings = 0;
  const sAt = L.findIndex((l) => /zusätzlichen Vorteile/.test(l));
  if (sAt >= 0) {
    for (let j = sAt + 1; j < L.length; j++) {
      const m = /^\s*Summe\s+(\d+,\d{2})/.exec(L[j]);
      if (m) {
        savings = cents(m[1]);
        break;
      }
    }
  }

  return {
    id: `rewe-${marketId}-${date}-${bonNo}`,
    store: "rewe",
    market: { id: marketId, street, city },
    date,
    time,
    checkoutSeconds: Number.isFinite(secs) ? secs : null,
    totalCents,
    items,
    payments,
    tax,
    bonus: { earnedCents: earned ? cents(earned[1]) : 0, balanceCents: balance ? cents(balance[1]) : null, coupons },
    savingsCents: savings,
    warnings,
  };
}
