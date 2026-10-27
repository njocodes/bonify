<div align="center">

# Bonify

**Your grocery shopping, explored from digital receipts. Nothing is uploaded.**

[bonify.njo.quest](https://bonify.njo.quest) · [Report a bug](https://github.com/njocodes/bonify/issues) · [Security](SECURITY.md) · MIT licensed

</div>

Import your supermarket receipts as PDF and explore what you buy, what it costs and how that changes. It starts with **REWE eBons**, more supermarkets are welcome (see below). The whole app is a static site: **your receipts are read in your browser and never uploaded.**

## Features

- **Overview:** spending per month, number of trips, average basket, where the money goes (categories), stores, payment methods and VAT
- **Products:** every product with total spend, how often you bought it and its **price history**, a list of products that **got more expensive** (one-off offers and discounts are recognised and not counted), plus your **personal inflation** (a price index over the things you actually buy)
- **Habits:** when you shop (weekday and hour), time between trips, time at the checkout, calendar of spending
- **Bonus & savings:** bonus balance over time, coupons, discounts at the till, deposit paid
- **Categories** from a keyword list, correctable per product (kept on your device)
- Period filter (all time, this year, 90 days), German and English, Classic and Clean design
- **Backup:** save everything as one file and load it on another device
- Installable PWA that works offline

## Privacy

- PDFs are read in your browser (pdf.js). Card numbers, payment terminal data and the TSE signature printed on a receipt are **never stored**.
- Receipts are kept in your browser (IndexedDB). There is no server code, no accounts, no analytics.
- The app makes no third-party requests. Fonts are served from the app itself.
- "Delete all data" in Settings removes everything stored.

## Get your receipts

In the REWE app open *Meine Einkäufe* and download or share your eBons as PDF. Drop the PDFs (or a ZIP with several) onto Bonify. Receipts you import twice are skipped.

## More supermarkets

Each chain has its own receipt layout and needs a small parser. Missing yours? [Open an issue](https://github.com/njocodes/bonify/issues/new/choose) with the *New supermarket* template, or add a parser yourself (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Develop

```bash
npm install
npm run dev
npm run typecheck && npm run lint
npm test
npm run build    # static export to ./out
```

Stack: Next.js (App Router, static export), TypeScript, Tailwind CSS 4, Recharts, `idb`, `pdfjs-dist`, `fflate`.

| Path | What |
| --- | --- |
| `src/app` | pages and the design tokens (`globals.css`) |
| `src/lib/parse` | PDF text extraction and one parser per supermarket |
| `src/lib/categories` | keyword list that sorts products into categories |
| `src/lib/stats` | pure aggregation functions |
| `src/lib/store` | settings, state and IndexedDB |
| `src/lib/i18n` | German and English texts |
| `scripts/` | offline service worker template and generator (`public/sw.js` is generated at build) |

To test with your own receipts, put the PDFs in `Deine Rewe eBons/` (git-ignored); `npm test` then also runs against them. **Never commit receipts.**

## Contributing

Issues and pull requests are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

Bonify is an independent hobby project. It is **not affiliated with, endorsed by or sponsored by REWE** or any other supermarket chain. All trademarks belong to their owners.

## License

[MIT](LICENSE)
