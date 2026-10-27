"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tick = { fill: "var(--muted)", fontSize: 10 };
const tip = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--fg)", fontSize: 12 };

type Fmt = (v: number) => string;

/** Plain bar chart; `data` rows are { x, y }. */
export function BarsChart({ data, name, fmt, tickFmt }: { data: { x: string; y: number }[]; name: string; fmt: Fmt; tickFmt?: (x: string) => string }) {
  return (
    <div className="h-56 w-full" role="img" aria-label={name}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -10, right: 4, top: 4 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="x" tick={tick} tickFormatter={tickFmt} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={tick} tickFormatter={fmt} axisLine={false} tickLine={false} width={48} />
          <Tooltip cursor={{ fill: "var(--surface-2)" }} contentStyle={tip} formatter={(v) => [fmt(Number(v)), name]} labelFormatter={(l) => (tickFmt ? tickFmt(String(l)) : String(l))} />
          <Bar dataKey="y" fill="var(--accent)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type DotProps = { cx?: number; cy?: number; payload?: { o?: boolean }; index?: number };

/** `o: true` rows are drawn as hollow dots (one-off offers). */
export function LinesChart({ data, name, fmt, tickFmt, step = false, domain }: { data: { x: string; y: number; o?: boolean }[]; name: string; fmt: Fmt; tickFmt?: (x: string) => string; step?: boolean; domain?: [number | "auto", number | "auto"] }) {
  return (
    <div className="h-48 w-full" role="img" aria-label={name}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -10, right: 8, top: 4 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="x" tick={tick} tickFormatter={tickFmt} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={tick} tickFormatter={fmt} axisLine={false} tickLine={false} width={48} domain={domain ?? ["auto", "auto"]} />
          <Tooltip contentStyle={tip} formatter={(v) => [fmt(Number(v)), name]} labelFormatter={(l) => (tickFmt ? tickFmt(String(l)) : String(l))} />
          <Line type={step ? "stepAfter" : "monotone"} dataKey="y" stroke="var(--accent)" strokeWidth={2} dot={(p: DotProps) => (data.length < 25 || p.payload?.o ? <circle key={p.index} cx={p.cx} cy={p.cy} r={p.payload?.o ? 5 : 3} fill={p.payload?.o ? "var(--bg)" : "var(--accent)"} stroke="var(--accent)" strokeWidth={2} /> : <g key={p.index} />)} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AreaSeries({ data, name, fmt, tickFmt }: { data: { x: string; y: number }[]; name: string; fmt: Fmt; tickFmt?: (x: string) => string }) {
  return (
    <div className="h-48 w-full" role="img" aria-label={name}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -10, right: 8, top: 4 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="x" tick={tick} tickFormatter={tickFmt} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={tick} tickFormatter={fmt} axisLine={false} tickLine={false} width={48} />
          <Tooltip contentStyle={tip} formatter={(v) => [fmt(Number(v)), name]} labelFormatter={(l) => (tickFmt ? tickFmt(String(l)) : String(l))} />
          <Area type="stepAfter" dataKey="y" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal share bars for lists (categories, stores, payment). */
export function ShareBars({ rows }: { rows: { label: string; value: number; text: string; sub?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="shrink-0 tabular-nums">{r.text}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </div>
          {r.sub && <div className="mt-0.5 text-xs text-muted">{r.sub}</div>}
        </li>
      ))}
    </ul>
  );
}
