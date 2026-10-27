# Contributing

Thanks for helping! Small, focused pull requests are easiest to review.

## Setup

```bash
npm install
npm run dev
```

Before opening a PR run `npm run typecheck && npm run lint && npm test`.

## Ground rules

- **Privacy first:** no analytics, no uploading of receipts, no new third-party requests without a clear opt-in.
- **Never commit receipts** (PDFs, ZIPs, exports) or screenshots that show someone's purchases. Anything real stays in git-ignored files.
- Never read or store card numbers, terminal ids, trace numbers, operator ids or signatures from a receipt.
- Keep it static: no server routes or server-side compute.
- Mobile first: no horizontal scroll at 390 px, respect safe areas and `prefers-reduced-motion`.
- New UI text goes into both languages in `src/lib/i18n/dict.ts` (English, German). TypeScript fails the build if a key is missing.
- Be kind, see the [Code of Conduct](CODE_OF_CONDUCT.md).

## Add a supermarket

1. Create `src/lib/parse/<chain>.ts` with `isChain(lines)` (does this text look like that chain's receipt?) and `parseChain(lines): Receipt`. Use `src/lib/parse/rewe.ts` as the model and fill every field of `Receipt` in `types.ts`.
2. Register it in `PARSERS` in `src/lib/parse/index.ts` and add the chain id to `StoreChain` in `types.ts`.
3. Add a test with a **made-up** receipt in `src/lib/__tests__/` (see `synthetic.test.ts`). Do not use a real one.
4. Check that the sum of the items equals the receipt total. Parsers report mismatches in `warnings`.

PDF text arrives as lines with the printed column layout (`src/lib/parse/pdf.ts`).

## Improve categories

Products are sorted by the ordered keyword rules in `src/lib/categories/index.ts`. The first matching rule wins, so put specific rules before general ones. Names are matched in upper case as printed on the receipt.

## Add a language

Add the language to `LANGS` and a full set of texts in `src/lib/i18n/dict.ts`, plus the selector in the Settings page.

## Bugs

Please include browser/device, steps, and the page. Do not attach receipts.
