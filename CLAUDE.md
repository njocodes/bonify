# Bonify

Auswertung des eigenen Einkaufsverhaltens aus digitalen Kassenbons (zuerst REWE-eBons als PDF, später weitere Märkte). Läuft komplett lokal im Browser. Design und Stack orientieren sich an `../statify`.

## Open-Source-Vorgaben

- Repo: `https://github.com/njocodes/bonify.git` (GitHub-User `njocodes`), Lizenz MIT, Copyright njocodes.
- Das Projekt wird öffentlich. Alles, was committet wird, ist öffentlich lesbar.
- Rein lokal: keine Konten, kein Backend, keine Datenbank, kein Upload der Bons. Daten bleiben im Browser (IndexedDB). Keine neuen Drittanbieter-Requests, Tracker oder Analytics ohne ausdrücklichen Opt-in und Nachfrage.
- Nie committen: `.env*`, API-Keys, Tokens, `.vercel`, persönliche Daten, Exporte, Screenshots mit fremden Daten, lokale Tool-Ordner (`.claude/`, `launch-checks/`). Vor jedem Commit `git status` auf so etwas prüfen.
- Echte Bons (`Deine Rewe eBons/`, `*.pdf`, `*.zip`) sind in `.gitignore`. Tests, die echte Bons brauchen (`src/lib/__tests__/real-data.test.ts`), ebenfalls. Im Parser nie Kartennummer, Terminal-ID, Trace-Nr., TSE-Signatur oder Bediener-ID übernehmen.
- UI-Sprachen: Deutsch und Englisch. Neue UI-Texte immer in beiden. Doku auf Englisch.
- Mobile first (iOS: `viewport-fit=cover`, `env(safe-area-inset-*)`, `100dvh`), kein horizontaler Overflow (Test bei 390 px).
- Prüfbefehle: `npm run typecheck && npm run lint && npm test`.
- Deploy: Vercel, Push auf `main` löst den Build aus. Keine Deploy-Hooks. Nach dem Push Deployment prüfen.
- Dokumentation (README, CONTRIBUTING, CHANGELOG) bei Features mitpflegen, nicht erst am Ende.
- Commits ohne Co-Authored-By/Claude-Attribution. Auf "push": auf `main` committen und pushen, danach Vercel-Deployment prüfen.
- Rechtliche Seiten (Impressum/Datenschutz, Kontakt über GitHub-Profil/Issues) nur beim Release und nach Rückfrage anlegen.
- Zum Abschluss `/opensource-setup release` ausführen.
