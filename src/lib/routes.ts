import type { NotificationLink } from "./types";

/** Each surface has its own URLs for the same things. Shared components ask for routes instead of hard-coding them. */
export interface SurfaceRoutes {
  surface: "app" | "store";
  listing: (id: string, clubId?: string) => string;
  order: (id: string) => string;
  label: (id: string) => string;
  wallet: string;
  payout: (id: string) => string;
  inbox: string;
  conversation: (id: string) => string;
  sell: string;
  profile: (userId: string) => string;
  account: string;
  checkout: (ids: string[]) => string;
  onboarding: string;
}

export const appRoutes: SurfaceRoutes = {
  surface: "app",
  listing: (id) => `/app/listing/${id}`,
  order: (id) => `/app/orders/${id}`,
  label: (id) => `/app/orders/${id}/label`,
  wallet: "/app/wallet",
  payout: (id) => `/app/payout/${id}`,
  inbox: "/app/inbox",
  conversation: (id) => `/app/inbox/${id}`,
  sell: "/app/sell",
  profile: (id) => `/app/seller/${id}`,
  account: "/app/me",
  checkout: (ids) => `/app/checkout/${ids.join(",")}`,
  onboarding: "/app/onboarding",
};

export function storeRoutes(clubId: string): SurfaceRoutes {
  const base = `/store/${clubId}`;
  return {
    surface: "store",
    // Other clubs' shirts aren't in this store, so they open in The Locker app.
    listing: (id, listingClub) => (listingClub && listingClub !== clubId ? `/app/listing/${id}` : `${base}/item/${id}`),
    order: (id) => `${base}/order/${id}`,
    // Labels and sending happen on the phone.
    label: (id) => `/app/orders/${id}/label`,
    wallet: `${base}/account`,
    payout: (id) => `${base}/payout/${id}`,
    inbox: `${base}/inbox`,
    conversation: (id) => `${base}/inbox/${id}`,
    sell: `${base}/sell`,
    profile: (id) => `${base}/seller/${id}`,
    account: `${base}/account`,
    checkout: (ids) => `${base}/checkout/${ids.join(",")}`,
    onboarding: `${base}/onboarding`,
  };
}

export function linkHref(r: SurfaceRoutes, link: NotificationLink | undefined, userId: string): string {
  if (!link) return r.inbox;
  switch (link.to) {
    case "listing":
      return r.listing(link.id!);
    case "order":
      return r.order(link.id!);
    case "label":
      return r.label(link.id!);
    case "wallet":
      return r.wallet;
    case "payout":
      return r.payout(link.id!);
    case "conversation":
      return r.conversation(link.id!);
    case "sell":
      return r.sell;
    case "profile":
      return r.profile(link.id ?? userId);
    case "account":
      return r.account;
  }
}

/** Store links that leave the store (to the app) need to break out of the demo iframe. */
export const isAppLink = (href: string) => href.startsWith("/app/");
