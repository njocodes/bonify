# Security

Bonify is a static site: it has no server, no accounts and no database, and your receipts stay in your browser.

## Reporting a vulnerability

Please report problems **privately** through GitHub: *Security → Report a vulnerability* in this repository. Do not open a public issue for a vulnerability, and do not attach your receipts.

I will answer as soon as I can, usually within a week.

## What counts

- Cross-site scripting or injection through crafted PDFs, ZIP files or backup files
- Anything that makes the app send receipt data to a third party
- Card numbers or other payment details from a receipt ending up in storage or backups
- Weaknesses in the service worker or the Content-Security-Policy in `vercel.json`

## Supported versions

Only the latest version on `main` (live at https://bonify.njo.quest) is supported.
