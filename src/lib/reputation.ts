import { HMRC_LIMITS } from "./pricing";
import type { Listing, LockerState } from "./types";

export function rating(s: LockerState, userId: string) {
  const r = s.reviews.filter((x) => x.to === userId);
  return { avg: r.length ? r.reduce((a, x) => a + x.stars, 0) / r.length : 0, count: r.length };
}

export const completedSales = (s: LockerState, userId: string) =>
  s.orders.filter((o) => o.sellerId === userId && o.status === "completed").length;

/** How far back cancellations count on a seller's profile. */
export const CANCELLATION_WINDOW_DAYS = 90;

/**
 * Cancellations that count against a seller: missing the 5-working-day deadline, or cancelling a sale
 * themselves (damaged, can't find it, sold elsewhere). Either way the buyer was let down. A cancellation
 * the buyer agreed to, or one caused by The Locker or the carrier, wouldn't count (not in the prototype yet).
 */
export const sellerCancellations = (s: LockerState, userId: string) => {
  const since = Date.now() - CANCELLATION_WINDOW_DAYS * 86400_000;
  return s.orders.filter(
    (o) => o.sellerId === userId && o.status === "cancelled" && o.cancellation && new Date(o.cancellation.at).getTime() >= since,
  ).length;
};

export function badges(s: LockerState, userId: string): string[] {
  const u = s.users[userId];
  const b: string[] = [];
  if (u.seller.status === "verified") b.push("ID verified");
  if (u.seller.fastDispatch) b.push("Fast dispatch");
  if (u.seller.type === "business") b.push("Business seller");
  if (rating(s, userId).avg >= 4.8 && rating(s, userId).count >= 3) b.push("Top rated");
  return b;
}

/** This calendar year against HMRC's reporting limits (the prototype adds the demo's own completed sales). */
export function taxYear(s: LockerState, userId: string) {
  const year = new Date().getFullYear();
  const own = s.orders.filter((o) => o.sellerId === userId && o.status === "completed" && new Date(o.createdAt).getFullYear() === year);
  const sales = s.users[userId].seller.taxYear.sales + own.length;
  const earnings = s.users[userId].seller.taxYear.earnings + own.reduce((a, o) => a + o.itemPrice, 0);
  const near = sales >= HMRC_LIMITS.sales * 0.8 || earnings >= HMRC_LIMITS.earnings * 0.8;
  const over = sales >= HMRC_LIMITS.sales || earnings >= HMRC_LIMITS.earnings;
  return { year, sales, earnings, near, over };
}

/** Live, and the seller isn't on holiday or on hold. */
export const isVisible = (s: LockerState, l: Listing) =>
  l.status === "live" && !s.users[l.sellerId].seller.holiday && !s.users[l.sellerId].seller.onHold;

/** The price this buyer pays for the shirt (an accepted offer overrides the listing price while it lasts). */
export function priceFor(l: Listing, buyerId?: string) {
  const r = l.reservedFor;
  return r && r.buyerId === buyerId && r.until > new Date().toISOString() ? r.price : l.price;
}

/** Reserved for someone else by an accepted offer. */
export const reservedForOther = (l: Listing, buyerId?: string) =>
  !!l.reservedFor && l.reservedFor.buyerId !== buyerId && l.reservedFor.until > new Date().toISOString();
