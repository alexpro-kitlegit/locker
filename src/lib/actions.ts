import { getClub } from "../data/clubs";
import { payoutOptions } from "./payouts";
import { buyerFee, CARRIERS, NFC_THRESHOLD } from "./pricing";
import { getState, setState } from "./store";
import type { Carrier, Draft, Listing, Order, OrderStatus, PaymentMethod, PayoutMethod, ShirtType } from "./types";

const now = () => new Date().toISOString();
const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
const code = (n: number) =>
  Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

export const newCheckId = () => `KL-${digits(5)}`;

/** How long the background KitLegit check takes in the prototype. */
const REVIEW_MS = 8000;

// --- Accounts -------------------------------------------------------------

/** Prototype: who is signed in on the club stores. In production this is the fan's own session. */
export function setStoreUser(userId: string | null) {
  setState((s) => ({ ...s, storeUserId: userId }));
}

/** Prototype: a hand-off link signs the app in as the draft's owner (same Locker account). */
export function setAppUser(userId: string) {
  setState((s) => (s.meId === userId ? s : { ...s, meId: userId }));
}

// --- Drafts and listings ----------------------------------------------------

export function createDraft(ownerId: string, startedOn: Draft["startedOn"]): string {
  const id = `d-${digits(6)}`;
  setState((s) => ({
    ...s,
    drafts: [{ id, ownerId, startedOn, step: "upload", pool: [], slots: {}, details: {}, updatedAt: now() }, ...s.drafts],
  }));
  return id;
}

export function updateDraft(id: string, patch: Partial<Draft>) {
  setState((s) => ({ ...s, drafts: s.drafts.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: now() } : d)) }));
}

export function deleteDraft(id: string) {
  setState((s) => ({ ...s, drafts: s.drafts.filter((d) => d.id !== id) }));
}

/** Submits a draft. The listing waits in review while KitLegit checks it, then goes live or is rejected. */
export function submitDraft(draftId: string): string {
  const id = `l-${digits(6)}`;
  setState((s) => {
    const d = s.drafts.find((x) => x.id === draftId)!;
    const checkId = newCheckId();
    const price = d.price!;
    const id_ = d.identified!;
    const uploaded = Object.values(d.slots).filter((x) => x?.photo).length;
    const listing: Listing = {
      id,
      clubId: id_.clubId,
      type: listingType(d),
      season: id_.season ?? "Unknown",
      size: d.details.size!,
      condition: d.details.condition!,
      version: d.details.version,
      gender: d.details.gender,
      printing: d.details.printing,
      description: d.details.description,
      price,
      sellerId: d.ownerId,
      status: "in_review",
      reviewDueAt: new Date(Date.now() + REVIEW_MS).toISOString(),
      createdAt: now(),
      listedVia: d.startedOn,
      photo: d.slots.front?.photo?.thumb,
      nfcTag: price >= NFC_THRESHOLD ? `FN-${digits(5)}` : undefined,
      check: {
        id: checkId,
        verdict: s.demo.nextVerdict,
        certificate: s.demo.nextVerdict === "authentic" ? checkId : undefined,
        labels: `${uploaded} photos`,
        checkedAt: now(),
      },
    };
    return { ...s, listings: [listing, ...s.listings], drafts: s.drafts.filter((x) => x.id !== draftId) };
  });
  return id;
}

/** Stands in for KitLegit's result arriving (get-result / webhook). */
export function resolveDueReviews() {
  const due = getState().listings.some((l) => l.status === "in_review" && l.reviewDueAt! <= now());
  if (!due) return;
  setState((s) => ({
    ...s,
    listings: s.listings.map((l) =>
      l.status === "in_review" && l.reviewDueAt! <= now()
        ? { ...l, status: l.check.verdict === "authentic" ? "live" : "rejected" }
        : l,
    ),
  }));
}

// --- Orders -----------------------------------------------------------------

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
    const balances =
      input.paymentMethod === "locker_balance"
        ? { ...s.balances, [input.buyerId]: (s.balances[input.buyerId] ?? 0) - total }
        : s.balances;
    return {
      ...s,
      orders: [order, ...s.orders],
      listings: s.listings.map((l) => (l.id === listing.id ? { ...l, status: "sold" } : l)),
      balances,
    };
  });
  return id;
}

function updateOrder(orderId: string, update: (o: Order) => Order) {
  setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === orderId ? update(o) : o)) }));
}

/** The carrier's first scan at drop-off (a ShipStation tracking event). */
export function dispatchOrder(orderId: string) {
  updateOrder(orderId, (o) => ({
    ...o,
    status: "dispatched",
    tracking: `${o.carrier === "inpost" ? "IP" : o.carrier === "evri" ? "EV" : "RM"} ${digits(4)} ${digits(4)} ${digits(4)}`,
    events: [...o.events, { status: "dispatched", at: now() }],
  }));
}

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { dispatched: "in_transit", in_transit: "delivered", delivered: "completed" };

/** Prototype control: stands in for ShipStation tracking webhooks. */
export function advanceOrder(orderId: string) {
  updateOrder(orderId, (o) => {
    const next = NEXT[o.status];
    return next ? { ...o, status: next, events: [...o.events, { status: next, at: now() }] } : o;
  });
}

/** The buyer says it's all good before the 48 hours are up. */
export function confirmReceived(orderId: string) {
  updateOrder(orderId, (o) => (o.status === "delivered" ? { ...o, status: "completed", events: [...o.events, { status: "completed", at: now() }] } : o));
}

export function choosePayout(orderId: string, method: PayoutMethod) {
  const s = getState();
  const order = s.orders.find((o) => o.id === orderId)!;
  const listing = s.listings.find((l) => l.id === order.listingId)!;
  const option = payoutOptions(order.itemPrice, listing.clubId).find((o) => o.method === method)!;
  const club = option.club;
  const creditCode = club ? `${club.initials}-${code(4)}-${code(4)}` : undefined;

  setState((st) => ({
    ...st,
    orders: st.orders.map((o) =>
      o.id === orderId ? { ...o, payout: { method, amount: option.amount, clubId: club?.id, code: creditCode, at: now() } } : o,
    ),
    balances:
      method === "locker_balance"
        ? { ...st.balances, [order.sellerId]: (st.balances[order.sellerId] ?? 0) + option.amount }
        : st.balances,
    credits:
      club && creditCode
        ? [{ id: `cc-${digits(6)}`, clubId: club.id, code: creditCode, amount: option.amount, orderId, issuedAt: now() }, ...st.credits]
        : st.credits,
  }));
}

export function setNextVerdict(verdict: "authentic" | "counterfeit") {
  setState((s) => ({ ...s, demo: { ...s.demo, nextVerdict: verdict } }));
}

/** Prototype: make the analysis unsure of the shirt, which sends the seller through season select. */
export function setUnsureId(unsureId: boolean) {
  setState((s) => ({ ...s, demo: { ...s.demo, unsureId } }));
}

/** The listing's shirt type, from KitLegit's kit type and position. */
export function listingType(d: Draft): ShirtType {
  if (d.details.position === "Goalkeeper") return "Goalkeeper";
  const k = d.details.kitType;
  if (k === "Home" || k === "Away" || k === "Third") return k;
  if (k === "Fourth" || k === "Training") return "Third";
  return d.identified?.type ?? "Home";
}

export const clubOf = (clubId: string) => getClub(clubId)!;
