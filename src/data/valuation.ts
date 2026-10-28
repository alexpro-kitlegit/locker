import type { Condition, ShirtType, Size } from "../lib/types";

// Stand-in for a valuation built from KitLegit's data (purchase prices on checks, plus Locker sale prices).
const CONDITION_FACTOR: Record<Condition, number> = { "New with tags": 1.2, "New without tags": 1.1, Excellent: 1, Average: 0.82, Poor: 0.6 };
const SIZE_FACTOR: Partial<Record<Size, number>> = { XS: 0.9, XXL: 0.95 };

export interface Valuation {
  low: number;
  high: number;
  suggested: number;
  basedOn: number;
}

export function valueShirt(shirt: { clubId: string; type: ShirtType; season: string }, condition: Condition, size: Size): Valuation {
  const year = Number(shirt.season.slice(0, 4));
  const age = 2026 - year;
  // Recent shirts lose value, then retro shirts gain it back.
  let base = age <= 3 ? 48 - age * 4 : age <= 12 ? 34 : 34 + (age - 12) * 4.5;
  if (shirt.type === "Goalkeeper") base *= 0.9;
  if (shirt.type === "Home") base *= 1.08;

  const mid = base * CONDITION_FACTOR[condition] * (SIZE_FACTOR[size] ?? 1);
  const seed = [...`${shirt.clubId}${shirt.season}${shirt.type}`].reduce((a, c) => a + c.charCodeAt(0), 0);

  return {
    low: Math.round(mid * 0.88) * 100,
    high: Math.round(mid * 1.12) * 100,
    suggested: Math.round(mid) * 100,
    basedOn: 8 + (seed % 60),
  };
}
