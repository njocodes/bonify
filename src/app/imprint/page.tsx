"use client";
import { Ext, GH_ISSUES, GH_PROFILE, GH_REPO, LegalPage, type LegalText } from "@/components/LegalPage";

const en: LegalText = {
  title: "Imprint",
  blocks: [
    { h: "About this site", p: <p>Bonify is a free, non-commercial, open-source hobby project without ads or revenue. It is not affiliated with REWE or any other supermarket chain.</p> },
    {
      h: "Contact",
      p: (
        <p>
          Via GitHub: <Ext href={GH_ISSUES}>open an issue</Ext> or write to the maintainer on the <Ext href={GH_PROFILE}>GitHub profile njocodes</Ext>. Source code and licence: <Ext href={GH_REPO}>github.com/njocodes/bonify</Ext> (MIT).
        </p>
      ),
    },
  ],
};

const de: LegalText = {
  title: "Impressum",
  blocks: [
    { h: "Über diese Seite", p: <p>Bonify ist ein kostenloses, nicht kommerzielles Open-Source-Hobbyprojekt ohne Werbung und ohne Einnahmen. Es steht in keiner Verbindung zu REWE oder einer anderen Supermarktkette.</p> },
    {
      h: "Kontakt",
      p: (
        <p>
          Über GitHub: <Ext href={GH_ISSUES}>Issue eröffnen</Ext> oder dem Betreiber über das <Ext href={GH_PROFILE}>GitHub-Profil njocodes</Ext> schreiben. Quellcode und Lizenz: <Ext href={GH_REPO}>github.com/njocodes/bonify</Ext> (MIT).
        </p>
      ),
    },
  ],
};

export default function Imprint() {
  return <LegalPage texts={{ en, de }} />;
}
