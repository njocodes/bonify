"use client";
import { Ext, GH_ISSUES, LegalPage, type LegalText } from "@/components/LegalPage";

const en: LegalText = {
  title: "Privacy",
  blocks: [
    { h: "Short version", p: <p>Bonify has no server, no accounts, no cookies and no analytics. The receipts you load are read in your browser and stay on your device.</p> },
    {
      h: "What stays on your device",
      p: <p>Your receipts (without card numbers or payment terminal data, which are never read into the app), your category corrections and your settings (language, design, period) are stored in your browser (IndexedDB and local storage). The app files are also cached for offline use. Nothing of this is sent to me. You can delete it any time in Settings.</p>,
    },
    {
      h: "Hosting",
      p: <p>The site is delivered by Vercel Inc. (USA). Like every web host, Vercel processes technical connection data such as your IP address, the requested page and the time in server logs. Bonify itself does not see or evaluate this data.</p>,
    },
    { h: "Requests to third parties", p: <p>None. Fonts and all other files come from the site itself.</p> },
    { h: "Your rights", p: <p>As far as personal data is processed by the hosting provider you can ask for access, correction and deletion and may complain to a data protection authority. For anything about this project contact me through <Ext href={GH_ISSUES}>GitHub Issues</Ext>.</p> },
  ],
};

const de: LegalText = {
  title: "Datenschutz",
  blocks: [
    { h: "Kurzfassung", p: <p>Bonify hat keinen Server, keine Konten, keine Cookies und keine Analyse. Die geladenen Bons werden in deinem Browser gelesen und bleiben auf deinem Gerät.</p> },
    {
      h: "Was auf deinem Gerät bleibt",
      p: <p>Deine Bons (ohne Kartennummern und Zahlungsterminal-Daten, die gar nicht erst in die App gelesen werden), deine Kategorie-Korrekturen und deine Einstellungen (Sprache, Design, Zeitraum) liegen in deinem Browser (IndexedDB und Local Storage). Die App-Dateien werden außerdem für die Offline-Nutzung zwischengespeichert. Nichts davon wird an mich gesendet. Du kannst es jederzeit in den Einstellungen löschen.</p>,
    },
    {
      h: "Hosting",
      p: <p>Die Seite wird von Vercel Inc. (USA) ausgeliefert. Wie bei jedem Webhoster verarbeitet Vercel technische Verbindungsdaten wie IP-Adresse, aufgerufene Seite und Uhrzeit in Server-Logs. Bonify selbst sieht und wertet diese Daten nicht aus.</p>,
    },
    { h: "Anfragen an Dritte", p: <p>Keine. Schriften und alle anderen Dateien kommen von der Seite selbst.</p> },
    { h: "Deine Rechte", p: <p>Soweit der Hosting-Anbieter personenbezogene Daten verarbeitet, kannst du Auskunft, Berichtigung und Löschung verlangen und dich bei einer Datenschutzaufsicht beschweren. Für alles zu diesem Projekt erreichst du mich über <Ext href={GH_ISSUES}>GitHub Issues</Ext>.</p> },
  ],
};

export default function Privacy() {
  return <LegalPage texts={{ en, de }} />;
}
