import type { ReactNode } from "react";

export const inputClass =
  "mt-1 w-full rounded-lg border border-river-200 bg-white px-3 py-2 text-sm text-river-950 shadow-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200";

export const labelClass = "text-xs font-medium text-river-700";

export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-river-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-river-700 disabled:opacity-60";

export const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-river-200 bg-white px-3 py-2 text-sm font-medium text-river-800 transition-colors hover:bg-river-50";

export const buttonDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-river-100 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-river-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium tracking-wide text-river-500 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-river-500">{hint}</p> : null}
    </Card>
  );
}

const tones: Record<string, string> = {
  river: "bg-river-50 text-river-700 border-river-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-800 border-amber-100",
  red: "bg-red-50 text-red-700 border-red-100",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

export function Badge({
  children,
  tone = "river",
}: {
  children: ReactNode;
  tone?: keyof typeof tones | string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        tones[tone] ?? tones.river
      }`}
    >
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <Card className="p-8 text-center text-sm text-river-500">{children}</Card>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-river-500">{hint}</span> : null}
    </label>
  );
}

export function statusTone(status: string): string {
  if (["CONFIRMED", "PAID", "COMPLETED"].includes(status)) return "green";
  if (["PENDING", "UNPAID"].includes(status)) return "amber";
  if (["CANCELLED", "FAILED", "REFUNDED"].includes(status)) return "red";
  return "slate";
}
