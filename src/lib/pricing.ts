import type { Carrier, PayoutMethod } from "./types";

// Buyer fee taken from the PDF's screens: a £56.41 shirt shows as £59.93 in the club store.
// That is 5% + 70p, which is a placeholder until the fee is decided.
export const BUYER_FEE_PCT = 0.05;
export const BUYER_FEE_FIXED = 70;

export const CLUB_CREDIT_RATE = 1.1;
export const BANK_FEE_PCT = 0.05;
export const BANK_FEE_FIXED = 50;

/** Listings at or above this price get a FanNFC tag. Placeholder. */
export const NFC_THRESHOLD = 10000;

export const buyerFee = (price: number) => Math.round(price * BUYER_FEE_PCT) + BUYER_FEE_FIXED;
export const allInPrice = (price: number) => price + buyerFee(price);

export function payoutAmount(price: number, method: PayoutMethod): number {
  switch (method) {
    case "club_credit":
      return Math.round(price * CLUB_CREDIT_RATE);
    case "locker_balance":
      return price;
    case "bank":
      return Math.round(price * (1 - BANK_FEE_PCT)) - BANK_FEE_FIXED;
  }
}

export const CARRIERS: Record<Carrier, { name: string; detail: string; price: number; eta: string }> = {
  inpost: { name: "InPost", detail: "Locker or shop, no printer", price: 199, eta: "2–3 days" },
  evri: { name: "Evri", detail: "ParcelShop drop-off", price: 249, eta: "2–4 days" },
  royal_mail: { name: "Royal Mail", detail: "Tracked 48, £75 cover", price: 375, eta: "2–3 days" },
  dpd: { name: "DPD", detail: "Pickup shop, seller prints the label", price: 299, eta: "1–2 days" },
};

/** Carriers whose label has to be printed by the seller. Hidden from buyers when the seller has no printer. */
export const PRINT_ONLY: Carrier[] = ["dpd"];

/** Smallest amount a seller can move out of the wallet (to the bank or club credit). */
export const MIN_MOVE = 500;

/** Offers can be at most 20% below the listing price. */
export const MAX_OFFER_DISCOUNT = 0.2;
export const minOffer = (price: number) => Math.ceil(price * (1 - MAX_OFFER_DISCOUNT));

/** Placeholder price of a KitLegit expert review of a rejected listing. */
export const EXPERT_REVIEW_FEE = 499;

/** HMRC reporting limits for platform sellers, per calendar year. */
export const HMRC_LIMITS = { sales: 30, earnings: 170000 };

export const formatGBP = (pence: number) =>
  "£" + (pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
