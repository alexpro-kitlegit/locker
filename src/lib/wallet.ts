import type { LockerState, WalletEntry } from "./types";

/** Stripe Connect balances must be paid out within 90 days, so unspent sale money moves to the bank then. */
export const AUTO_TRANSFER_DAYS = 90;

export const walletEntries = (s: LockerState, userId: string) =>
  s.wallet.filter((e) => e.userId === userId).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

export const walletBalance = (s: LockerState, userId: string) =>
  s.wallet.filter((e) => e.userId === userId).reduce((sum, e) => sum + e.remaining, 0);

/** Money that arrived but the seller hasn't looked at yet. */
export const unreviewed = (s: LockerState, userId: string) => s.wallet.filter((e) => e.userId === userId && !e.reviewed);

/**
 * How much of the wallet can become each club's credit: only money from that partner club's shirts.
 * Everything can go to the bank.
 */
export function creditCaps(s: LockerState, userId: string): { clubId: string; cap: number }[] {
  const caps = new Map<string, number>();
  for (const e of s.wallet)
    if (e.userId === userId && e.creditClubId && e.remaining > 0) caps.set(e.creditClubId, (caps.get(e.creditClubId) ?? 0) + e.remaining);
  return [...caps].map(([clubId, cap]) => ({ clubId, cap }));
}

export function newEntry(userId: string, orderId: string, amount: number, receivedAt: Date, creditClubId?: string): WalletEntry {
  const auto = new Date(receivedAt);
  auto.setDate(auto.getDate() + AUTO_TRANSFER_DAYS);
  return {
    id: `w-${orderId}`,
    userId,
    orderId,
    amount,
    remaining: amount,
    receivedAt: receivedAt.toISOString(),
    autoTransferAt: auto.toISOString(),
    reviewed: false,
    creditClubId,
  };
}

/**
 * Takes money out of the wallet. For club credit, only that club's money is used. Otherwise money that can't become
 * credit goes first (so the seller keeps their 110% options), then the oldest (closest to its automatic transfer).
 */
export function spend(entries: WalletEntry[], userId: string, total: number, onlyClubId?: string): WalletEntry[] {
  const order = entries
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.userId === userId && e.remaining > 0 && (!onlyClubId || e.creditClubId === onlyClubId))
    .sort((a, b) => Number(!!a.e.creditClubId) - Number(!!b.e.creditClubId) || a.e.receivedAt.localeCompare(b.e.receivedAt));
  const next = [...entries];
  let left = total;
  for (const { e, i } of order) {
    if (left <= 0) break;
    const taken = Math.min(e.remaining, left);
    next[i] = { ...e, remaining: e.remaining - taken, reviewed: true };
    left -= taken;
  }
  return next;
}

export const formatDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
