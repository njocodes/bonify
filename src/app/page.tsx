"use client";
import { Dropzone } from "@/components/Dropzone";
import { useBonify } from "@/lib/store/BonifyProvider";

export default function Home() {
  const { t } = useBonify();
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl">{t("import_title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("import_lead")}</p>
      <div className="mt-6">
        <Dropzone />
      </div>
      <section className="card mt-6 p-4 text-sm">
        <h2 className="text-base">{t("import_howto_title")}</h2>
        <p className="mt-1 text-muted">{t("import_howto")}</p>
        <p className="mt-3 text-xs text-muted">{t("import_privacy")}</p>
      </section>
    </div>
  );
}
