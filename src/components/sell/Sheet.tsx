import clsx from "clsx";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/** A centred modal on wide screens, a bottom sheet on narrow ones (as KitLegit switches at 1024px). */
export function Sheet({
  title,
  sub,
  eyebrow,
  top,
  onClose,
  children,
  wide = true,
}: {
  title: ReactNode;
  sub?: ReactNode;
  eyebrow?: string;
  top?: ReactNode;
  onClose?: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl",
          wide ? "sm:max-w-md" : "sm:max-w-sm",
        )}
      >
        {onClose && (
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1 hover:bg-neutral-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        )}
        {top}
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{eyebrow}</p>}
        <h2 className="pr-6 text-lg font-bold">{title}</h2>
        {sub && <p className="mt-1 text-sm text-neutral-500">{sub}</p>}
        <div className="mt-4 space-y-2">{children}</div>
      </div>
    </div>
  );
}

export function SheetButton({
  children,
  onClick,
  variant = "secondary",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "block w-full rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-40",
        variant === "primary" && "bg-accent text-on-accent",
        variant === "secondary" && "border border-neutral-200 bg-white",
        variant === "ghost" && "text-neutral-500",
      )}
    >
      {children}
    </button>
  );
}
