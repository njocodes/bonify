"use client";
import { useBonify } from "@/lib/store/BonifyProvider";
import type { Key } from "@/lib/i18n/dict";

export function ErrorBanner() {
  const { error, t } = useBonify();
  if (!error) return null;
  return (
    <div role="alert" className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded-xl border border-line bg-surface2 p-3 text-sm">
      {t(error as Key)}
    </div>
  );
}
