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
  { status: "delivered", label: "Delivered" },
];

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
