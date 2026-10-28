import { getClub } from "../data/clubs";
import { blockedWords, contactDetails } from "./moderation";
import { buyerFee, CARRIERS, EXPERT_REVIEW_FEE, NFC_THRESHOLD, payoutAmount } from "./pricing";
import { priceFor } from "./reputation";
import { getState, setState } from "./store";
import type {
  Carrier,
  Conversation,
  Draft,
  Listing,
  LockerState,
  Notification,
  Order,
  OrderStatus,
  PaymentMethod,
  PayoutMethod,
  SellerProfile,
  ShirtType,
  WalletMove,
} from "./types";
import { newEntry, spend } from "./wallet";

const now = () => new Date().toISOString();
const later = (ms: number) => new Date(Date.now() + ms).toISOString();
const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
const code = (n: number) =>
  Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const firstName = (s: LockerState, id: string) => s.users[id].name.split(" ")[0];
const shirt = (l: Listing) => `${l.type} ${l.season}`;

export const newCheckId = () => `KL-${digits(5)}`;

/** How long the background KitLegit check and an expert review take in the prototype. */
const REVIEW_MS = 8000;
const EXPERT_MS = 10000;
/** An accepted offer holds the shirt for the buyer for 24 hours; offers expire after 48. */
const RESERVE_MS = 24 * 3600_000;
const OFFER_MS = 48 * 3600_000;
/** Failed checks in a row before the account goes on hold. */
const HOLD_AFTER = 3;

/** Adds a notification (stands in for push, email and the in-app inbox). */
function notify(s: LockerState, n: Omit<Notification, "id" | "at" | "read">): LockerState {
  return { ...s, notifications: [{ ...n, id: `n-${digits(7)}`, at: now(), read: false }, ...s.notifications] };
}

const updateSellerIn = (s: LockerState, userId: string, patch: Partial<SellerProfile>): LockerState => ({
  ...s,
  users: { ...s.users, [userId]: { ...s.users[userId], seller: { ...s.users[userId].seller, ...patch } } },
});

// --- Accounts -------------------------------------------------------------

/** Prototype: who is signed in on the club stores. In production this is the fan's own session. */
export function setStoreUser(userId: string | null) {
  setState((s) => ({ ...s, storeUserId: userId }));
}

/** Prototype: a hand-off link signs the app in as the draft's owner (same Locker account). */
export function setAppUser(userId: string) {
  setState((s) => (s.meId === userId ? s : { ...s, meId: userId }));
}

/** Seller onboarding finished: Stripe has verified ID and bank (mocked). */
export function completeOnboarding(userId: string, profile: Partial<SellerProfile>) {
  setState((s) => updateSellerIn(s, userId, { ...profile, status: "verified", termsAcceptedAt: now() }));
}

export function updateSeller(userId: string, patch: Partial<SellerProfile>) {
  setState((s) => updateSellerIn(s, userId, patch));
}

/** Prototype control: support lifts a hold after investigating. */
export function liftHold(userId: string) {
  setState((s) => updateSellerIn(s, userId, { onHold: false, failedStreak: 0 }));
}

export function markNotificationsRead(userId: string) {
  setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)) }));
}

// --- Drafts and listings ----------------------------------------------------

export function createDraft(ownerId: string, startedOn: Draft["startedOn"], extra: Partial<Draft> = {}): string {
  const id = `d-${digits(6)}`;
  setState((s) => ({
    ...s,
    drafts: [{ id, ownerId, startedOn, step: "upload", pool: [], slots: {}, details: {}, updatedAt: now(), ...extra }, ...s.drafts],
  }));
  return id;
}

export function updateDraft(id: string, patch: Partial<Draft>) {
  setState((s) => ({ ...s, drafts: s.drafts.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: now() } : d)) }));
}

export function deleteDraft(id: string) {
  setState((s) => ({ ...s, drafts: s.drafts.filter((d) => d.id !== id) }));
}

/** List a shirt already checked in the KitLegit app: no photos, no new check. Goes straight to details and price. */
export function startFromKitLegit(userId: string, recordId: string, startedOn: Draft["startedOn"]): string {
  const r = getState().kitlegit.find((x) => x.id === recordId)!;
  const club = getClub(r.clubId)!;
  return createDraft(userId, startedOn, {
    step: "confirm",
    fromKitLegit: r.id,
    demoShirt: { clubId: r.clubId, type: r.type, season: r.season },
    identified: { clubId: r.clubId, brand: club.brand, season: r.season, type: r.type, confident: true },
    slots: { front: { status: "uploaded", photo: { id: `p-${r.id}`, sample: "front" } }, back: { status: "uploaded", photo: { id: `p-${r.id}b`, sample: "back" } } },
    details: { condition: r.condition, kitType: r.type === "Goalkeeper" ? undefined : r.type },
  });
}

/** Re-list a shirt bought on The Locker. It's a new listing, so it's checked again. */
export function startRelist(userId: string, orderId: string, startedOn: Draft["startedOn"]): string {
  const s = getState();
  const l = s.listings.find((x) => x.id === s.orders.find((o) => o.id === orderId)!.listingId)!;
  return createDraft(userId, startedOn, { relistOf: l.id, demoShirt: { clubId: l.clubId, type: l.type, season: l.season } });
}

/** Submits a draft. Usually the listing waits in review while KitLegit checks it; a KitLegit-app check goes live at once. */
export function submitDraft(draftId: string): string {
  const id = `l-${digits(6)}`;
  setState((s) => {
    const d = s.drafts.find((x) => x.id === draftId)!;
    const record = d.fromKitLegit ? s.kitlegit.find((r) => r.id === d.fromKitLegit) : undefined;
    const checkId = record?.certificate ?? newCheckId();
    const verdict = record ? "authentic" : s.demo.nextVerdict;
    const price = d.price!;
    const ident = d.identified!;
    const uploaded = Object.values(d.slots).filter((x) => x?.photo).length;
    const listing: Listing = {
      id,
      clubId: ident.clubId,
      type: listingType(d),
      season: ident.season ?? "Unknown",
      size: d.details.size!,
      condition: d.details.condition!,
      version: d.details.version,
      gender: d.details.gender,
      printing: d.details.printing,
      description: d.details.description,
      price,
      sellerId: d.ownerId,
      status: record ? "live" : "in_review",
      reviewDueAt: record ? undefined : later(REVIEW_MS),
      createdAt: now(),
      listedVia: d.startedOn,
      source: record ? "kitlegit" : "check",
      relistedFrom: d.relistOf,
      photo: d.slots.front?.photo?.thumb,
      nfcTag: price >= NFC_THRESHOLD ? `FN-${digits(5)}` : undefined,
      check: {
        id: checkId,
        verdict,
        certificate: verdict === "authentic" ? checkId : undefined,
        labels: record ? "KitLegit app check" : `${uploaded} photos`,
        checkedAt: record?.checkedAt ?? now(),
      },
    };
    let next: LockerState = {
      ...s,
      listings: [listing, ...s.listings],
      drafts: s.drafts.filter((x) => x.id !== draftId),
      kitlegit: s.kitlegit.map((r) => (r.id === record?.id ? { ...r, listingId: id } : r)),
    };
    if (record) next = notify(next, { userId: d.ownerId, kind: "listing_live", title: "Your listing is live", body: shirt(listing), link: { to: "listing", id } });
    return next;
  });
  return id;
}

/**
 * Stands in for KitLegit's results arriving (get-result / webhook), for background checks and expert reviews.
 * A rejection counts towards the hold: 3 in a row and the account is paused while we investigate.
 */
export function resolveDueReviews() {
  const t = now();
  const s0 = getState();
  if (!s0.listings.some((l) => (l.status === "in_review" && l.reviewDueAt! <= t) || (l.status === "expert_review" && l.expertReview!.dueAt <= t))) return;

  setState((s) => {
    let next = s;
    for (const l of s.listings) {
      const seller = () => next.users[l.sellerId].seller;
      if (l.status === "in_review" && l.reviewDueAt! <= t) {
        const ok = l.check.verdict === "authentic";
        next = { ...next, listings: next.listings.map((x) => (x.id === l.id ? { ...x, status: ok ? "live" : "rejected" } : x)) };
        if (ok) {
          next = updateSellerIn(next, l.sellerId, { failedStreak: 0 });
          next = notify(next, { userId: l.sellerId, kind: "listing_live", title: "Your listing is live", body: shirt(l), link: { to: "listing", id: l.id } });
        } else {
          const streak = seller().failedStreak + 1;
          next = updateSellerIn(next, l.sellerId, { failedStreak: streak, onHold: streak >= HOLD_AFTER || seller().onHold });
          next = notify(next, {
            userId: l.sellerId,
            kind: "listing_rejected",
            title: "We couldn't list your shirt",
            body: `${shirt(l)}. You can ask an expert to take a second look.`,
            link: { to: "listing", id: l.id },
          });
          if (streak === HOLD_AFTER)
            next = notify(next, {
              userId: l.sellerId,
              kind: "account_hold",
              title: "Your account is on hold",
              body: "Three shirts in a row didn't pass. We're taking a look and will be in touch within 2 working days.",
              link: { to: "sell" },
            });
        }
      }
      if (l.status === "expert_review" && l.expertReview!.dueAt <= t) {
        const ok = next.demo.expertVerdict === "authentic";
        next = {
          ...next,
          listings: next.listings.map((x) =>
            x.id === l.id
              ? {
                  ...x,
                  status: ok ? "live" : "rejected",
                  expertReview: { ...x.expertReview!, outcome: ok ? "authentic" : "counterfeit" },
                  check: ok ? { ...x.check, verdict: "authentic", certificate: x.check.id } : x.check,
                }
              : x,
          ),
        };
        if (ok) next = updateSellerIn(next, l.sellerId, { failedStreak: Math.max(0, seller().failedStreak - 1) });
        next = notify(next, {
          userId: l.sellerId,
          kind: "expert_result",
          title: ok ? "Good news: the expert says it's authentic" : "The expert confirmed it isn't authentic",
          body: ok ? `${shirt(l)} is now live.` : `${shirt(l)} can't be listed. We've shared the result with Back Four.`,
          link: { to: "listing", id: l.id },
        });
      }
    }
    return next;
  });
}

/** A paid second look by a KitLegit expert for a rejected listing. */
export function requestExpertReview(listingId: string) {
  setState((s) => ({
    ...s,
    listings: s.listings.map((l) =>
      l.id === listingId ? { ...l, status: "expert_review", expertReview: { fee: EXPERT_REVIEW_FEE, requestedAt: now(), dueAt: later(EXPERT_MS) } } : l,
    ),
  }));
}

export function setExpertVerdict(v: "authentic" | "counterfeit") {
  setState((s) => ({ ...s, demo: { ...s.demo, expertVerdict: v } }));
}

// --- Listing management -----------------------------------------------------

export function updatePrice(listingId: string, price: number) {
  setState((s) => ({
    ...s,
    listings: s.listings.map((l) => (l.id === listingId ? { ...l, price, previousPrice: price < l.price ? l.price : undefined } : l)),
  }));
}

export function withdrawListing(listingId: string) {
  setState((s) => ({ ...s, listings: s.listings.map((l) => (l.id === listingId ? { ...l, status: "withdrawn", reservedFor: undefined } : l)) }));
}

/** Put a withdrawn listing back up. Same shirt, same check, so no new check. */
export function relistWithdrawn(listingId: string) {
  setState((s) => ({ ...s, listings: s.listings.map((l) => (l.id === listingId ? { ...l, status: "live" } : l)) }));
}

// --- Messages and offers ----------------------------------------------------

export function openConversation(listingId: string, buyerId: string): string {
  const s = getState();
  const existing = s.conversations.find((c) => c.listingId === listingId && c.buyerId === buyerId);
  if (existing) return existing.id;
  const l = s.listings.find((x) => x.id === listingId)!;
  const id = `c-${digits(6)}`;
  setState((st) => ({
    ...st,
    conversations: [{ id, listingId, buyerId, sellerId: l.sellerId, messages: [], updatedAt: now() }, ...st.conversations],
  }));
  return id;
}

function addMessage(s: LockerState, convId: string, msg: Conversation["messages"][number], patch: Partial<Conversation> = {}): LockerState {
  return {
    ...s,
    conversations: s.conversations.map((c) => (c.id === convId ? { ...c, ...patch, messages: [...c.messages, msg], updatedAt: msg.at } : c)),
  };
}

/** Sends a message, unless it breaks the guardrails. Returns the reason it was blocked, if it was. */
export function sendMessage(convId: string, from: string, text: string): string | null {
  const found = contactDetails(text);
  if (found) return `To keep you safe, messages can't include ${found}. Keep chat and payment in The Locker, where you're protected.`;
  const words = blockedWords(text);
  if (words.length) return `"${words.join('", "')}" isn't allowed in messages.`;
  setState((s) => {
    const c = s.conversations.find((x) => x.id === convId)!;
    const to = from === c.buyerId ? c.sellerId : c.buyerId;
    const next = addMessage(s, convId, { id: `m-${digits(7)}`, from, at: now(), kind: "text", text });
    return notify(next, { userId: to, kind: "message", title: `${firstName(s, from)} sent you a message`, body: text.slice(0, 80), link: { to: "conversation", id: convId } });
  });
  return null;
}

/** A buyer's offer, or a seller's counter. Replaces any live offer in the thread. */
export function makeOffer(convId: string, from: string, amount: number) {
  setState((s) => {
    const c = s.conversations.find((x) => x.id === convId)!;
    const l = s.listings.find((x) => x.id === c.listingId)!;
    const to = from === c.buyerId ? c.sellerId : c.buyerId;
    const counter = from === c.sellerId;
    const next = addMessage(
      s,
      convId,
      { id: `m-${digits(7)}`, from, at: now(), kind: "offer", amount },
      { offer: { amount, by: from, status: "pending", expiresAt: later(OFFER_MS) } },
    );
    return notify(next, {
      userId: to,
      kind: "offer",
      title: counter ? `${firstName(s, from)} countered with £${(amount / 100).toFixed(2)}` : `${firstName(s, from)} offered £${(amount / 100).toFixed(2)}`,
      body: `For ${shirt(l)}. ${counter ? "Accept or decline." : "Accept, decline or counter."}`,
      link: { to: "conversation", id: convId },
    });
  });
}

/** Accepting holds the shirt for the buyer at the offer price for 24 hours. */
export function respondToOffer(convId: string, by: string, accept: boolean) {
  setState((s) => {
    const c = s.conversations.find((x) => x.id === convId)!;
    const offer = c.offer!;
    const buyerPays = offer.amount;
    let next = addMessage(
      s,
      convId,
      { id: `m-${digits(7)}`, from: by, at: now(), kind: "system", text: accept ? `Offer of £${(buyerPays / 100).toFixed(2)} accepted` : "Offer declined" },
      { offer: { ...offer, status: accept ? "accepted" : "declined" } },
    );
    if (accept)
      next = {
        ...next,
        listings: next.listings.map((l) => (l.id === c.listingId ? { ...l, reservedFor: { buyerId: c.buyerId, price: buyerPays, until: later(RESERVE_MS) } } : l)),
      };
    const to = by === c.buyerId ? c.sellerId : c.buyerId;
    return notify(next, {
      userId: to,
      kind: "offer",
      title: accept ? `${firstName(s, by)} accepted £${(buyerPays / 100).toFixed(2)}` : `${firstName(s, by)} declined the offer`,
      body: accept && to === c.buyerId ? "It's held for you for 24 hours. Buy it now at that price." : undefined,
      link: { to: "conversation", id: convId },
    });
  });
}

// --- Orders -----------------------------------------------------------------

/**
 * Places an order for one shirt or a bundle from one seller. Bundles get the seller's bundle discount and travel
 * in one parcel. An accepted offer sets the price for that buyer.
 */
export function placeOrder(input: {
  listingIds: string[];
  buyerId: string;
  channel: Order["channel"];
  clubId?: string;
  paymentMethod: PaymentMethod;
  carrier: Carrier;
  dropOff: string;
}): string {
  const id = `LK-${digits(5)}`;
  setState((s) => {
    const listings = input.listingIds.map((lid) => s.listings.find((l) => l.id === lid)!);
    const seller = s.users[listings[0].sellerId];
    const discount = listings.length > 1 ? seller.seller.bundleDiscount : 0;
    const itemPrice = Math.round(listings.reduce((sum, l) => sum + priceFor(l, input.buyerId), 0) * (1 - discount / 100));
    const fee = buyerFee(itemPrice);
    const postage = CARRIERS[input.carrier].price;
    const total = itemPrice + fee + postage;
    const { listingIds, ...rest } = input;
    const order: Order = {
      ...rest,
      id,
      listingId: listingIds[0],
      extraListingIds: listingIds.length > 1 ? listingIds.slice(1) : undefined,
      bundleDiscount: discount || undefined,
      sellerId: seller.id,
      itemPrice,
      fee,
      postage,
      total,
      status: "paid",
      events: [{ status: "paid", at: now() }],
      dispatchReminders: 0,
      createdAt: now(),
    };
    const next: LockerState = {
      ...s,
      orders: [order, ...s.orders],
      listings: s.listings.map((l) => (listingIds.includes(l.id) ? { ...l, status: "sold", reservedFor: undefined } : l)),
      wallet: input.paymentMethod === "locker_balance" ? spend(s.wallet, input.buyerId, total) : s.wallet,
    };
    return notify(next, {
      userId: seller.id,
      kind: "sold",
      title: listings.length > 1 ? `Sold! A bundle of ${listings.length} shirts` : `Sold! ${shirt(listings[0])}`,
      body: "Your label is ready. Send it within 5 working days.",
      link: { to: "label", id },
    });
  });
  return id;
}

export const orderListingIds = (o: Order) => [o.listingId, ...(o.extraListingIds ?? [])];

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { paid: "dispatched", dispatched: "in_transit", in_transit: "delivered", delivered: "completed" };

/** Moves an order on, with the notifications each step sends. Completing it releases the money into the seller's wallet. */
function moveOrder(orderId: string, to: OrderStatus) {
  setState((s) => {
    const order = s.orders.find((o) => o.id === orderId)!;
    let next: LockerState = {
      ...s,
      orders: s.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: to,
              events: [...o.events, { status: to, at: now() }],
              tracking:
                to === "dispatched" ? `${{ inpost: "IP", evri: "EV", royal_mail: "RM", dpd: "DP" }[o.carrier]} ${digits(4)} ${digits(4)} ${digits(4)}` : o.tracking,
            }
          : o,
      ),
    };
    if (to === "dispatched")
      next = notify(next, { userId: order.buyerId, kind: "dispatched", title: "Your shirt is on its way", body: `Sent with ${CARRIERS[order.carrier].name}.`, link: { to: "order", id: orderId } });
    if (to === "delivered") {
      next = notify(next, { userId: order.buyerId, kind: "delivered", title: "Delivered. Is everything OK?", body: "You have 48 hours to report a problem.", link: { to: "order", id: orderId } });
      next = notify(next, { userId: order.sellerId, kind: "delivered", title: "Delivered", body: "The money lands in your wallet in 48 hours.", link: { to: "order", id: orderId } });
    }
    if (to === "completed" && !s.wallet.some((e) => e.orderId === orderId)) {
      // One wallet entry per shirt, so each can become its own club's credit.
      const ids = orderListingIds(order);
      const listings = ids.map((lid) => s.listings.find((l) => l.id === lid)!);
      const gross = listings.reduce((a, l) => a + l.price, 0) || 1;
      const entries = listings.map((l, i) => {
        const club = getClub(l.clubId)!;
        const amount = i === listings.length - 1 ? order.itemPrice - listings.slice(0, -1).reduce((a, x) => a + Math.round((x.price / gross) * order.itemPrice), 0) : Math.round((l.price / gross) * order.itemPrice);
        return { ...newEntry(order.sellerId, orderId, amount, new Date(), club.partner ? club.id : undefined), id: `w-${orderId}-${i}` };
      });
      next = { ...next, wallet: [...entries, ...next.wallet] };
      next = notify(next, {
        userId: order.sellerId,
        kind: "money_in",
        title: `£${(order.itemPrice / 100).toFixed(2)} is in your wallet`,
        body: "Keep it, or swap it for club credit or cash.",
        link: { to: "payout", id: orderId },
      });
      next = notify(next, { userId: order.buyerId, kind: "review", title: `How was ${firstName(s, order.sellerId)}?`, body: "Leave a rating for this order.", link: { to: "order", id: orderId } });
    }
    return next;
  });
}

/** The carrier's first scan at drop-off (a ShipStation tracking event). */
export function dispatchOrder(orderId: string) {
  moveOrder(orderId, "dispatched");
}

/** Prototype control: stands in for ShipStation tracking webhooks and the 48-hour window ending. */
export function advanceOrder(orderId: string) {
  const next = NEXT[getState().orders.find((o) => o.id === orderId)!.status];
  if (next && next !== "dispatched") moveOrder(orderId, next);
}

/** The buyer says it's all good before the 48 hours are up. */
export function confirmReceived(orderId: string) {
  if (getState().orders.find((o) => o.id === orderId)?.status === "delivered") moveOrder(orderId, "completed");
}

/**
 * Prototype control: a day passes without the seller sending it. Reminders on days 3 and 4, then the deadline
 * (5 working days) cancels the order and refunds the buyer.
 */
export function dispatchDayPasses(orderId: string) {
  const o = getState().orders.find((x) => x.id === orderId)!;
  const day = (o.dispatchReminders ?? 0) + 1;
  if (day >= 5) return cancelOrder(orderId, "deadline", "Not sent within 5 working days");
  setState((s) => {
    const next = { ...s, orders: s.orders.map((x) => (x.id === orderId ? { ...x, dispatchReminders: day } : x)) };
    return day >= 3
      ? notify(next, {
          userId: o.sellerId,
          kind: "send_reminder",
          title: day === 4 ? "Last day to send your shirt" : "Reminder: your shirt needs sending",
          body: day === 4 ? "If it isn't scanned by tomorrow, the order is cancelled and the buyer refunded." : "Drop it off in the next 2 working days.",
          link: { to: "label", id: orderId },
        })
      : next;
  });
}

/** Cancels a paid order (by the seller, like Vinted, or by the deadline). The buyer is refunded in full. */
export function cancelOrder(orderId: string, by: "seller" | "deadline", reason: string) {
  setState((s) => {
    const o = s.orders.find((x) => x.id === orderId)!;
    const ids = orderListingIds(o);
    let next: LockerState = {
      ...s,
      orders: s.orders.map((x) =>
        x.id === orderId ? { ...x, status: "cancelled", cancellation: { by, reason, at: now() }, events: [...x.events, { status: "cancelled", at: now() }] } : x,
      ),
      // The shirt comes down: the seller can put it back up when it's ready to send.
      listings: s.listings.map((l) => (ids.includes(l.id) ? { ...l, status: "withdrawn" } : l)),
    };
    next = notify(next, {
      userId: o.buyerId,
      kind: "cancelled",
      title: "Your order was cancelled",
      body: `${by === "seller" ? `${firstName(s, o.sellerId)} cancelled it` : "It wasn't sent in time"}. You've been refunded £${(o.total / 100).toFixed(2)}.`,
      link: { to: "order", id: orderId },
    });
    return notify(next, {
      userId: o.sellerId,
      kind: "cancelled",
      title: by === "seller" ? "Sale cancelled" : "Sale cancelled: not sent in time",
      body: "The buyer has been refunded. Cancellations show on your profile.",
      link: { to: "order", id: orderId },
    });
  });
}

/** Ratings both ways after an order completes. */
export function leaveReview(orderId: string, from: string, to: string, stars: number, text: string) {
  setState((s) =>
    notify(
      { ...s, reviews: [{ id: `r-${digits(6)}`, orderId, from, to, stars, text, at: now() }, ...s.reviews] },
      { userId: to, kind: "review", title: `${firstName(s, from)} left you ${stars} star${stars === 1 ? "" : "s"}`, body: text || undefined, link: { to: "profile" } },
    ),
  );
}

/** Prototype: the label emailed again. */
export function resendLabel(orderId: string) {
  setState((s) => {
    const o = s.orders.find((x) => x.id === orderId)!;
    return notify(s, { userId: o.sellerId, kind: "sold", title: "Label sent again", body: `We've emailed it to ${s.users[o.sellerId].email}.`, link: { to: "label", id: orderId } });
  });
}

// --- Wallet -----------------------------------------------------------------

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
  const entries = getState().wallet.filter((e) => e.orderId === orderId);
  if (method === "locker_balance") {
    setState((s) => ({ ...s, wallet: s.wallet.map((e) => (e.orderId === orderId ? { ...e, reviewed: true } : e)) }));
    return;
  }
  const entry = entries[0];
  const amount = entries.reduce((a, e) => a + e.remaining, 0);
  const move = makeMove(entry.userId, amount, method, entry.creditClubId);
  setState((s) =>
    withMove(
      {
        ...s,
        wallet: s.wallet.map((e) => (e.orderId === orderId ? { ...e, remaining: 0, reviewed: true, movedTo: method } : e)),
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, payout: { method, amount: move.received, clubId: move.clubId, code: move.code, at: move.at } } : o)),
      },
      move,
    ),
  );
}

// --- Prototype settings -----------------------------------------------------

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
