"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBonify } from "@/lib/store/BonifyProvider";
import type { Key } from "@/lib/i18n/dict";

const svg = (d: string) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const ITEMS: { href: string; key: Key; icon: ReactNode }[] = [
  { href: "/dashboard/", key: "nav_overview", icon: svg("M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z") },
  { href: "/products/", key: "nav_products", icon: svg("M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20h.01M18 20h.01") },
  { href: "/habits/", key: "nav_habits", icon: svg("M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2") },
  { href: "/bonus/", key: "nav_bonus", icon: svg("M12 3l2.5 6 6.5.5-5 4.3 1.6 6.4L12 16.8 6.4 20.2 8 13.8 3 9.5 9.5 9z") },
  { href: "/settings/", key: "nav_settings", icon: svg("M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.4 2.7a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 002 1.2L10 21h4l.4-2.7a7 7 0 002-1.2l2.4 1 2-3.4-2-1.5c.1-.4.2-.8.2-1.2z") },
];

export function Nav() {
  const { t } = useBonify();
  const path = usePathname();
  const active = (href: string) => path === href || path === href.slice(0, -1);
  return (
    <>
      <header className="sticky top-0 z-30 hidden border-b border-line bg-bg/90 backdrop-blur sm:block" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <nav className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-2" aria-label="Main">
          <Link href="/" className="display mr-4 text-lg">
            Bonify
          </Link>
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined} className={`rounded-full px-3 py-1.5 text-sm ${active(i.href) ? "bg-accent font-semibold text-onaccent" : "text-muted hover:text-fg"}`}>
              {t(i.key)}
            </Link>
          ))}
          <Link href="/" className="ml-auto rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:text-fg">
            {t("nav_import")}
          </Link>
        </nav>
      </header>
      <div className="h-[env(safe-area-inset-top)] sm:hidden" />
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="Main">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {ITEMS.map((i) => (
            <li key={i.href}>
              <Link href={i.href} aria-current={active(i.href) ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${active(i.href) ? "text-accent" : "text-muted"}`}>
                {i.icon}
                <span className="max-w-full truncate px-1">{t(i.key)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
