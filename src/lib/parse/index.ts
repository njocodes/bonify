import { isRewe, parseRewe } from "./rewe";
import type { Receipt } from "./types";

type Parser = { id: string; detect: (lines: string[]) => boolean; parse: (lines: string[]) => Receipt };

/** One parser per store chain. Add Lidl, Aldi, Edeka ... here. */
const PARSERS: Parser[] = [{ id: "rewe", detect: isRewe, parse: parseRewe }];

/** Parses receipt text lines with the first parser that recognises them, or returns null. */
export function parseReceipt(lines: string[]): Receipt | null {
  const p = PARSERS.find((x) => x.detect(lines));
  return p ? p.parse(lines) : null;
}

export type { Receipt, Item } from "./types";
