import clsx from "clsx";
import { Check, ChevronLeft } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { Club } from "../lib/types";

type Variant = "primary" | "secondary" | "dark" | "ghost";

export function Button({
  variant = "primary",
  block,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
        block && "w-full",
        variant === "primary" && "bg-accent text-on-accent hover:brightness-110",
        variant === "secondary" && "border border-neutral-200 bg-white text-ink hover:bg-neutral-50",
        variant === "dark" && "bg-ink text-white hover:bg-neutral-800",
        variant === "ghost" && "text-accent hover:bg-accent/5",
        className,
      )}
    />
  );
}

export function PoweredByKitLegit({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold text-white", className)}>
      Powered by KitLegit
    </span>
  );
}

export function CheckedBadge({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 text-[11px] font-semibold text-ink", className)}>
      <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-ink">
        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
      </span>
      Checked by KitLegit
    </span>
  );
}

const TICK_SIZES = {
  sm: ["h-4 w-4", "h-2.5 w-2.5"],
  md: ["h-5 w-5", "h-3 w-3"],
  lg: ["h-16 w-16", "h-8 w-8"],
} as const;

const TICK_TONES = { ink: "bg-ink text-white", locker: "bg-locker text-white", accent: "bg-accent text-on-accent" } as const;

export function TickCircle({
  size = "md",
  tone = "ink",
  className,
}: {
  size?: keyof typeof TICK_SIZES;
  tone?: keyof typeof TICK_TONES;
  className?: string;
}) {
  const [box, icon] = TICK_SIZES[size];
  return (
    <span className={clsx("grid shrink-0 place-items-center rounded-full", box, TICK_TONES[tone], className)}>
      <Check className={icon} strokeWidth={3.5} />
    </span>
  );
}

export function LockerLogo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 font-bold tracking-tight text-locker", className)}>
      <span className="grid h-4 w-4 place-items-center rounded-[4px] bg-locker">
        <span className="h-2 w-1.5 rounded-[1px] border-[1.5px] border-white" />
      </span>
      The Locker
    </span>
  );
}

export function Crest({ club, className }: { club: Club; className?: string }) {
  return (
    <svg viewBox="0 0 40 46" className={clsx("shrink-0", className)} aria-label={`${club.name} crest`}>
      <path d="M20 2 L37 8 V24 C37 34 29 41 20 44 C11 41 3 34 3 24 V8 Z" fill={club.primary} stroke={club.secondary} strokeWidth="2.5" />
      <text x="20" y="28" textAnchor="middle" fontSize="13" fontWeight="800" fill={club.onPrimary} fontFamily="Inter, sans-serif">
        {club.initials}
      </text>
    </svg>
  );
}

export function BackHeader({ title, right }: { title?: string; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2 px-4 pb-1 pt-2">
      <button onClick={() => navigate(-1)} className="-ml-2 rounded-full p-2 hover:bg-neutral-100" aria-label="Back">
        <ChevronLeft className="h-5 w-5" />
      </button>
      {title && <h1 className="flex-1 truncate text-base font-semibold">{title}</h1>}
      {right}
    </div>
  );
}

export function Row({ label, value, tick }: { label: ReactNode; value: ReactNode; tick?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 py-2.5 text-sm last:border-0">
      <span className="text-neutral-600">{label}</span>
      <span className="flex items-center gap-2 font-medium text-ink">
        {value}
        {tick && <TickCircle size="sm" />}
      </span>
    </div>
  );
}

/** Marks controls that only exist in the prototype (they stand in for integrations). */
export function PrototypeControls({ title = "Prototype controls", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-amber-400 bg-amber-50 p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-700">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function DemoButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-40"
    />
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-end justify-between">
      <h2 className="text-[15px] font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}
