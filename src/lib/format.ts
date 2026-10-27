export const eur = (cents: number, lang = "de") => new Intl.NumberFormat(lang, { style: "currency", currency: "EUR" }).format(cents / 100);
export const eurShort = (cents: number, lang = "de") => new Intl.NumberFormat(lang, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
export const fmtInt = (n: number, lang = "de") => new Intl.NumberFormat(lang).format(Math.round(n));
export const fmtDec = (n: number, lang = "de") => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(n);
export const pct = (n: number, lang = "de") => new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(n);
export function fmtDate(date: string, lang: string): string {
  return new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeZone: "UTC" }).format(Date.parse(date + "T12:00:00Z"));
}
export function fmtMonth(month: string, lang: string): string {
  return new Intl.DateTimeFormat(lang, { month: "short", year: "2-digit", timeZone: "UTC" }).format(Date.parse(month + "-15T12:00:00Z"));
}
