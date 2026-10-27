"use client";
import Link from "next/link";
import { useBonify } from "@/lib/store/BonifyProvider";

export function Footer() {
  const { t } = useBonify();
  return (
    <footer className="mt-12 border-t border-line pt-4 text-xs text-muted">
      <p>{t("footerDisclaimer")}</p>
      <p className="mt-1">
        <a href="https://github.com/njocodes/bonify" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {t("footerSource")}
        </a>{" "}
        · MIT · <Link href="/privacy/" className="underline underline-offset-2">{t("legalPrivacy")}</Link> · <Link href="/imprint/" className="underline underline-offset-2">{t("legalImprint")}</Link>
      </p>
    </footer>
  );
}
