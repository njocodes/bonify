"use client";

/** Segmented control: one pill with a sliding highlight, equal-width segments. */
export function Segmented<T extends string | number>({ value, options, onChange, label, size = "md" }: { value: T; options: [T, string][]; onChange: (v: T) => void; label?: string; size?: "sm" | "md" }) {
  const i = Math.max(0, options.findIndex(([v]) => v === value));
  return (
    <div role="group" aria-label={label} className={`relative inline-grid rounded-full border border-line bg-surface2 p-0.5 ${size === "sm" ? "text-xs" : "text-sm"}`} style={{ gridAutoColumns: "1fr", gridAutoFlow: "column" }}>
      <span aria-hidden className="absolute bottom-0.5 left-0.5 top-0.5 rounded-full bg-accent shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]" style={{ width: `calc((100% - 0.25rem) / ${options.length})`, transform: `translateX(${i * 100}%)` }} />
      {options.map(([v, text]) => (
        <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onChange(v)} className={`relative z-10 whitespace-nowrap rounded-full px-3 py-1 transition-colors duration-200 ${v === value ? "font-semibold text-onaccent" : "text-muted hover:text-fg"}`}>
          {text}
        </button>
      ))}
    </div>
  );
}
