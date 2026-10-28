import { getClub } from "../data/clubs";
import { buyerFee, CARRIERS, NFC_THRESHOLD, payoutAmount } from "./pricing";
import { getState, setState } from "./store";
import type { Carrier, Listing, Order, OrderStatus, PaymentMethod, PayoutMethod } from "./types";

const now = () => new Date().toISOString();
const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
const code = (n: number) =>
  Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

export const newCheckId = () => `KL-${digits(5)}`;

export function createListing(input: Omit<Listing, "id" | "status" | "createdAt" | "sellerId" | "nfcTag">): string {
  const id = `l-${digits(6)}`;
  setState((s) => ({
    ...s,
    listings: [
      {
        ...input,
        id,
        sellerId: s.meId,
        status: "live",
        createdAt: now(),
        nfcTag: input.price >= NFC_THRESHOLD ? `FN-${digits(5)}` : undefined,
      },
      ...s.listings,
    ],
  }));
  return id;
}

export function placeOrder(input: {
  listingId: string;
  buyerId: string;
  channel: Order["channel"];
  clubId?: string;
  paymentMethod: PaymentMethod;
  carrier: Carrier;
  dropOff: string;
}): string {
  const id = `LK-${digits(5)}`;
  setState((s) => {
    const listing = s.listings.find((l) => l.id === input.listingId)!;
    const fee = buyerFee(listing.price);
    const postage = CARRIERS[input.carrier].price;
    const total = listing.price + fee + postage;
    const order: Order = {
      ...input,
      id,
      sellerId: listing.sellerId,
      itemPrice: listing.price,
      fee,
      postage,
      total,
      status: "paid",
      events: [{ status: "paid", at: now() }],
      createdAt: now(),
    };
    return {
      ...s,
      orders: [order, ...s.orders],
      listings: s.listings.map((l) => (l.id === listing.id ? { ...l, status: "sold" } : l)),
      lockerBalance: input.paymentMethod === "locker_balance" ? s.lockerBalance - total : s.lockerBalance,
    };
  });
  return id;
}

function updateOrder(orderId: string, update: (o: Order) => Order) {
  setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === orderId ? update(o) : o)) }));
}

export function dispatchOrder(orderId: string, dispatchCheckId: string) {
  updateOrder(orderId, (o) => ({
    ...o,
    status: "dispatched",
    dispatchCheckId,
    tracking: `${o.carrier === "inpost" ? "IP" : o.carrier === "evri" ? "EV" : "RM"} ${digits(4)} ${digits(4)} ${digits(4)}`,
    events: [...o.events, { status: "dispatched", at: now() }],
  }));
}

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { dispatched: "in_transit", in_transit: "delivered" };

/** Prototype control: stands in for ShipStation tracking webhooks. */
export function advanceOrder(orderId: string) {
  updateOrder(orderId, (o) => {
    const next = NEXT[o.status];
    return next ? { ...o, status: next, events: [...o.events, { status: next, at: now() }] } : o;
  });
}

export function choosePayout(orderId: string, method: PayoutMethod) {
  const s = getState();
  const order = s.orders.find((o) => o.id === orderId)!;
  const seller = s.users[order.sellerId];
  const club = getClub(seller.clubId)!;
  const amount = payoutAmount(order.itemPrice, method);
  const creditCode = method === "club_credit" ? `${club.initials}-${code(4)}-${code(4)}` : undefined;

  setState((st) => ({
    ...st,
    orders: st.orders.map((o) =>
      o.id === orderId
        ? { ...o, payout: { method, amount, clubId: method === "club_credit" ? club.id : undefined, code: creditCode, at: now() } }
        : o,
    ),
    lockerBalance: method === "locker_balance" ? st.lockerBalance + amount : st.lockerBalance,
    credits: creditCode
      ? [{ id: `cc-${digits(6)}`, clubId: club.id, code: creditCode, amount, orderId, issuedAt: now() }, ...st.credits]
      : st.credits,
  }));
}

export function setNextVerdict(verdict: "authentic" | "counterfeit") {
  setState((s) => ({ ...s, demo: { ...s.demo, nextVerdict: verdict } }));
}
