"use client";
import Link from "next/link";
import { useBonify } from "@/lib/store/BonifyProvider";

export default function NotFound() {
  const { t } = useBonify();
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-3xl">{t("notFoundTitle")}</h1>
      <p className="text-sm text-muted">{t("notFoundText")}</p>
      <Link href="/" className="inline-block underline underline-offset-2 hover:text-fg">
        {t("notFoundHome")}
      </Link>
    </div>
  );
}
