export type StoreChain = "rewe";

export type Item = {
  /** name exactly as printed on the receipt (whitespace collapsed) */
  rawName: string;
  /** quantity: pieces, or kilograms when unit is "kg" */
  qty: number;
  unit: "pc" | "kg";
  /** price per piece or per kg, in cents */
  unitCents: number;
  /** line total in cents (negative for discounts) */
  cents: number;
  taxClass: "A" | "B";
  /** deposit (Pfand) lines: not discount-eligible and not a product */
  deposit: boolean;
  /** negative line that reduces the price of the line above (e.g. "gratis") */
  discount: boolean;
};

export type Payment = { method: string; cents: number };

export type Receipt = {
  /** stable id: store + market + date + receipt number */
  id: string;
  store: StoreChain;
  market: { id: string; street: string; city: string };
  /** ISO local date, YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  /** seconds between TSE start and stop, if printed */
  checkoutSeconds: number | null;
  totalCents: number;
  items: Item[];
  payments: Payment[];
  tax: { rate: number; netCents: number; taxCents: number; grossCents: number }[];
  bonus: { earnedCents: number; balanceCents: number | null; coupons: { name: string; cents: number }[] };
  /** extra savings printed under "zusätzliche Vorteile", in cents */
  savingsCents: number;
  /** non-fatal problems found while parsing (e.g. item sum differs from total) */
  warnings: string[];
};
