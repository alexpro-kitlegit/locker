import { getClub } from "../data/clubs";
import { buyerFee, CARRIERS, NFC_THRESHOLD, payoutAmount } from "./pricing";
import { getState, setState } from "./store";
import { newEntry, spend } from "./wallet";
import type { Carrier, Draft, Listing, Order, OrderStatus, PaymentMethod, PayoutMethod, ShirtType, WalletMove, LockerState } from "./types";

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
    return {
      ...s,
      orders: [order, ...s.orders],
      listings: s.listings.map((l) => (l.id === listing.id ? { ...l, status: "sold" } : l)),
      wallet: input.paymentMethod === "locker_balance" ? spend(s.wallet, input.buyerId, total) : s.wallet,
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

/** Moves an order on. Completing it releases the money into the seller's wallet (the default). */
function moveOrder(orderId: string, to: OrderStatus) {
  setState((s) => {
    const order = s.orders.find((o) => o.id === orderId)!;
    const orders = s.orders.map((o) => (o.id === orderId ? { ...o, status: to, events: [...o.events, { status: to, at: now() }] } : o));
    const credit = to === "completed" && !s.wallet.some((e) => e.orderId === orderId);
    const shirtClub = getClub(s.listings.find((l) => l.id === order.listingId)!.clubId)!;
    const entry = newEntry(order.sellerId, orderId, order.itemPrice, new Date(), shirtClub.partner ? shirtClub.id : undefined);
    return { ...s, orders, wallet: credit ? [entry, ...s.wallet] : s.wallet };
  });
}

/** Prototype control: stands in for ShipStation tracking webhooks and the 48-hour window ending. */
export function advanceOrder(orderId: string) {
  const next = NEXT[getState().orders.find((o) => o.id === orderId)!.status];
  if (next) moveOrder(orderId, next);
}

/** The buyer says it's all good before the 48 hours are up. */
export function confirmReceived(orderId: string) {
  if (getState().orders.find((o) => o.id === orderId)?.status === "delivered") moveOrder(orderId, "completed");
}

function makeMove(userId: string, amount: number, to: "club_credit" | "bank", clubId?: string): WalletMove {
  const club = to === "club_credit" ? getClub(clubId)! : undefined;
  return {
    id: `wm-${digits(6)}`,
    userId,
    to,
    clubId: club?.id,
    amount,
    received: payoutAmount(amount, to),
    code: club ? `${club.initials}-${code(4)}-${code(4)}` : undefined,
    at: now(),
  };
}

const withMove = (s: LockerState, move: WalletMove): LockerState => ({
  ...s,
  walletMoves: [move, ...s.walletMoves],
  credits: move.code
    ? [{ id: `cc-${digits(6)}`, userId: move.userId, clubId: move.clubId!, code: move.code, amount: move.received, issuedAt: move.at }, ...s.credits]
    : s.credits,
});

/**
 * Moves money out of the wallet: to a partner club's credit at 110% (only money from that club's shirts), or to the
 * bank with the 5% + 50p fee. The seller can do this as often as they like, so any split works.
 */
export function moveMoney(userId: string, amount: number, to: "club_credit" | "bank", clubId?: string): WalletMove {
  const move = makeMove(userId, amount, to, clubId);
  setState((s) => withMove({ ...s, wallet: spend(s.wallet, userId, amount, move.clubId) }, move));
  return move;
}

/** The "Sold! £x is in your wallet" shortcut for one sale: keep it (the default), or move that sale's money in one go. */
export function choosePayout(orderId: string, method: PayoutMethod) {
  const entry = getState().wallet.find((e) => e.orderId === orderId)!;
  if (method === "locker_balance") {
    setState((s) => ({ ...s, wallet: s.wallet.map((e) => (e.id === entry.id ? { ...e, reviewed: true } : e)) }));
    return;
  }
  const move = makeMove(entry.userId, entry.remaining, method, entry.creditClubId);
  setState((s) =>
    withMove(
      {
        ...s,
        wallet: s.wallet.map((e) => (e.id === entry.id ? { ...e, remaining: 0, reviewed: true, movedTo: method } : e)),
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, payout: { method, amount: move.received, clubId: move.clubId, code: move.code, at: move.at } } : o)),
      },
      move,
    ),
  );
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
