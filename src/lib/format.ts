import type { CSSProperties } from "react";
import type { Listing, OrderStatus } from "./types";

export const shirtTitle = (l: Pick<Listing, "type" | "season">) => `${l.type} ${l.season}`;

export const isRetro = (season: string) => Number(season.slice(0, 4)) < 2012;

export const firstName = (name: string) => name.split(" ")[0];

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "paid", label: "Paid, money held safely" },
  { status: "dispatched", label: "Dropped off" },
  { status: "in_transit", label: "On its way" },
  { status: "delivered", label: "Delivered, 48 hours to check it" },
  { status: "completed", label: "Completed, money released" },
];

/** Dispatch deadline: 5 working days from payment. */
export const DISPATCH_WORKING_DAYS = 5;
/** Buyer acceptance window after delivery. */
export const ACCEPTANCE_HOURS = 48;

export function sendBy(paidAt: string) {
  const d = new Date(paidAt);
  let left = DISPATCH_WORKING_DAYS;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left--;
  }
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function releaseAt(deliveredAt: string) {
  return new Date(new Date(deliveredAt).getTime() + ACCEPTANCE_HOURS * 3600_000).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Hex colour to "r g b" for the Tailwind accent variables. */
export function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export const accentVars = (primary: string, secondary: string, onPrimary: string) =>
  ({
    "--accent": hexToRgb(primary),
    "--accent-2": hexToRgb(secondary),
    "--on-accent": hexToRgb(onPrimary),
  }) as CSSProperties;
