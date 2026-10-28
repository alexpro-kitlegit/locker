export type ShirtType = "Home" | "Away" | "Third" | "Goalkeeper";
export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";
// The details below use KitLegit's own options (ConfirmStep), so a Locker listing maps 1:1 to a KitLegit check.
export type Condition = "New with tags" | "New without tags" | "Excellent" | "Average" | "Poor";
export type KitType = "Home" | "Away" | "Third" | "Fourth" | "Training" | "Not sure";
export type Gender = "Men's" | "Women's" | "Children's" | "Unisex";
export type KitVersion = "Stadium" | "Player" | "Not sure";
export type Position = "Outfield" | "Goalkeeper" | "Not sure";

export type KitPattern = "plain" | "stripes" | "hoops" | "sash" | "halves";
export interface Kit {
  body: string;
  trim: string;
  pattern: KitPattern;
  patternColor?: string;
}

export type TemplateId = "classic" | "bold" | "minimal";
export type CreditMethod = "shopify" | "codes" | "own_shop";
/** How a fan signs in on the club's store. Every option ends in one Locker account. */
export type AccountMethod = "shopify" | "club_sso" | "locker";

export interface Club {
  id: string;
  name: string;
  initials: string;
  /** Partner clubs have a store and offer 110% credit. Other clubs' shirts sell in The Locker app only. */
  partner: boolean;
  brand: string;
  primary: string;
  secondary: string;
  onPrimary: string;
  kits: Record<ShirtType, Kit>;
  // Partner clubs only
  domain?: string;
  shopDomain?: string;
  template?: TemplateId;
  creditMethod?: CreditMethod;
  accountMethod?: AccountMethod;
  /** What the club calls its own account, e.g. "Rovers ID". */
  accountName?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Favourite club, picked at sign-up. */
  clubId: string;
  city: string;
  /** Sales before the prototype's own orders (for reputation). */
  sales: number;
  joinedAt: string;
  seller: SellerProfile;
}

/** Everything collected at seller onboarding, plus selling settings and account state. */
export interface SellerProfile {
  /** "verified" once Stripe has checked ID and bank. Selling needs it. */
  status: "none" | "verified";
  type?: "private" | "business";
  businessName?: string;
  dob?: string;
  address?: { line1: string; city: string; postcode: string };
  /** NI number (private) or UTR (business), for HMRC reporting. Stored masked. */
  taxId?: string;
  bankLast4?: string;
  termsAcceptedAt?: string;
  /** Hides carriers that need a printed label (DPD) from buyers. */
  noPrinter?: boolean;
  /** Holiday mode: listings are hidden until it's turned off. */
  holiday?: boolean;
  /** Bundle discount for 2+ shirts from this seller, in percent. */
  bundleDiscount: number;
  /** Failed KitLegit checks in a row. 3 puts the account on hold. */
  failedStreak: number;
  onHold?: boolean;
  /** HMRC reporting thresholds are per calendar year. Prototype stand-in for this year's totals before the demo. */
  taxYear: { sales: number; earnings: number };
  fastDispatch?: boolean;
}

/** KitLegit's named photo slots (kitlegit-web src/lib/checkTypes.ts). */
export type NamedSlot =
  | "front"
  | "back"
  | "neck-label"
  | "wash-label"
  | "style-code"
  | "security-label"
  | "hologram"
  | "swing-tag";
/** Plus four "Other" slots, as in KitLegit's review grid. */
export type SlotKey = NamedSlot | "other1" | "other2" | "other3" | "other4";

/** KitLegit's slot statuses, minus the AI-only ones. */
export type SlotStatus = "empty" | "uploaded" | "blurry" | "dark" | "damaged" | "unreadable" | "not-present" | "removed";

export interface Photo {
  id: string;
  /** Small data-URL preview. The real app uploads the full photo to storage. */
  thumb?: string;
  /** Prototype sample photo: which slot it really shows (drawn instead of a real image). */
  sample?: NamedSlot;
}

export interface SlotState {
  status: SlotStatus;
  photo?: Photo;
}

/** A KitLegit check, as The Locker sees it. Maps to KitLegit's checks + current_effective_results + certificates. */
export interface KitLegitCheck {
  id: string;
  verdict: "authentic" | "counterfeit";
  certificate?: string;
  labels: string;
  checkedAt: string;
}

/**
 * in_review: the KitLegit check is running in the background (the seller is just told it's being prepared).
 * expert_review: a rejected listing the seller paid to have checked by hand.
 */
export type ListingStatus = "in_review" | "live" | "rejected" | "expert_review" | "sold" | "withdrawn";

export interface Listing {
  id: string;
  clubId: string;
  type: ShirtType;
  season: string;
  size: Size;
  condition: Condition;
  version?: KitVersion;
  gender?: Gender;
  /** What the seller gets, in pence. The buyer pays this plus the buyer fee. */
  price: number;
  sellerId: string;
  status: ListingStatus;
  createdAt: string;
  check: KitLegitCheck;
  /** Prototype stand-in for the background check finishing. */
  reviewDueAt?: string;
  /** Where the seller started the listing. */
  listedVia?: { surface: "app" | "store"; clubId?: string };
  photo?: string;
  nfcTag?: string;
  printing?: string;
  description?: string;
  /** Re-listed after being bought on The Locker (the original listing). */
  relistedFrom?: string;
  /** "kitlegit": listed from a check the seller already did in the KitLegit app (no new check). */
  source?: "check" | "kitlegit";
  /** Set when the price is lowered after listing. */
  previousPrice?: number;
  /** An accepted offer holds the shirt for that buyer at that price for 24 hours. */
  reservedFor?: { buyerId: string; price: number; until: string };
  expertReview?: { fee: number; requestedAt: string; dueAt: string; outcome?: "authentic" | "counterfeit" };
}

/** A check the fan did in the KitLegit app. Authentic ones can be listed in The Locker without a new check. */
export interface KitLegitRecord {
  id: string;
  userId: string;
  certificate: string;
  clubId: string;
  type: ShirtType;
  season: string;
  condition: Condition;
  verdict: "authentic" | "counterfeit";
  checkedAt: string;
  listingId?: string;
}

/** KitLegit's check steps plus The Locker's price step. Processing is transient and not saved. */
export type DraftStep = "upload" | "season" | "review" | "confirm" | "price";

export interface ListingDetails {
  size?: Size;
  kitType?: KitType;
  gender?: Gender;
  version?: KitVersion;
  position?: Position;
  condition?: Condition;
  purchasePlace?: string;
  purchasePrice?: string;
  currency?: string;
  /** For KitLegit's experts only, as in KitLegit. */
  notes?: string;
  printing?: string;
  /** Shown to buyers. Checked for blocked words. */
  description?: string;
}

/** A listing in progress. It can start in a club store and finish in the app, or the other way round. */
export interface Draft {
  id: string;
  ownerId: string;
  startedOn: { surface: "app" | "store"; clubId?: string };
  step: DraftStep;
  /** Photos added on the upload step, before they're sorted into slots. */
  pool: Photo[];
  slots: Partial<Record<SlotKey, SlotState>>;
  /** What the analysis found. confident=false sends the seller through season select. */
  identified?: { clubId: string; brand: string; season?: string; type: ShirtType; confident: boolean };
  /** Prototype: which shirt is in the photos. */
  demoShirt?: { clubId: string; type: ShirtType; season: string };
  securityCode?: string;
  details: ListingDetails;
  price?: number;
  /** Listing a check from the KitLegit app: skips photos and the check. */
  fromKitLegit?: string;
  /** Re-listing a shirt bought on The Locker: it's checked again. */
  relistOf?: string;
  updatedAt: string;
}

/** completed: 48 hours after delivery with no problem reported (or the buyer said it's all good). Money is released. */
export type OrderStatus = "paid" | "dispatched" | "in_transit" | "delivered" | "completed" | "cancelled";
export type Carrier = "inpost" | "evri" | "royal_mail" | "dpd";
export type PaymentMethod = "pay_by_bank" | "card" | "apple_pay" | "locker_balance";
export type PayoutMethod = "club_credit" | "locker_balance" | "bank";

export interface OrderEvent {
  status: OrderStatus;
  at: string;
}

export interface Payout {
  method: PayoutMethod;
  amount: number;
  clubId?: string;
  code?: string;
  at: string;
}

export interface Order {
  id: string;
  /** The first shirt. Bundles add the rest in extraListingIds. */
  listingId: string;
  extraListingIds?: string[];
  /** Bundle discount applied, in percent. */
  bundleDiscount?: number;
  buyerId: string;
  sellerId: string;
  /** Where the buyer bought it: The Locker app, or a club's store. */
  channel: "app" | "club";
  clubId?: string;
  itemPrice: number;
  fee: number;
  postage: number;
  total: number;
  paymentMethod: PaymentMethod;
  carrier: Carrier;
  dropOff: string;
  status: OrderStatus;
  events: OrderEvent[];
  tracking?: string;
  payout?: Payout;
  /** Prototype stand-in for days passing since payment (dispatch reminders and the deadline). */
  dispatchReminders?: number;
  cancellation?: { by: "seller" | "deadline"; reason: string; at: string };
  createdAt: string;
}

export type NotificationKind =
  | "listing_live"
  | "listing_rejected"
  | "expert_result"
  | "account_hold"
  | "sold"
  | "send_reminder"
  | "cancelled"
  | "dispatched"
  | "delivered"
  | "completed"
  | "money_in"
  | "auto_transfer"
  | "message"
  | "offer"
  | "review"
  | "tax";

/** Where a notification leads. Each surface turns it into its own route. */
export interface NotificationLink {
  to: "listing" | "order" | "label" | "wallet" | "payout" | "conversation" | "sell" | "profile" | "account";
  id?: string;
}

export interface Notification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  link?: NotificationLink;
  at: string;
  read: boolean;
}

/** A thread between a buyer and a seller about one listing. Questions and offers live together, as on Vinted. */
export interface Conversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  messages: Message[];
  /** The live offer, if any. */
  offer?: Offer;
  updatedAt: string;
}

export interface Message {
  id: string;
  from: string;
  at: string;
  kind: "text" | "offer" | "system";
  text?: string;
  amount?: number;
}

export interface Offer {
  amount: number;
  /** Who made the current offer (buyer, or seller when countering). */
  by: string;
  status: "pending" | "accepted" | "declined";
  expiresAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  from: string;
  to: string;
  stars: number;
  text: string;
  at: string;
}

/**
 * Sale money in the seller's wallet. It lands here by default when an order completes. The seller can spend it in
 * The Locker, swap it for club credit or withdraw it. Whatever is left moves to their bank 90 days after it arrived.
 */
export interface WalletEntry {
  id: string;
  userId: string;
  orderId: string;
  /** What arrived, in pence. */
  amount: number;
  /** Not yet spent or moved out. */
  remaining: number;
  receivedAt: string;
  autoTransferAt: string;
  /** The seller has seen the "it's in your wallet" choice. */
  reviewed: boolean;
  /** Set when this sale's money was moved out in one go from its "just arrived" screen. */
  movedTo?: "club_credit" | "bank";
  /** The shirt's club, if it's a partner: this money can become that club's credit. */
  creditClubId?: string;
}

export interface ClubCredit {
  id: string;
  userId: string;
  clubId: string;
  code: string;
  amount: number;
  issuedAt: string;
}

/** Money moved out of the wallet: to club credit (110%) or to the bank (5% + 50p fee), or automatically after 90 days. */
export interface WalletMove {
  id: string;
  userId: string;
  to: "club_credit" | "bank";
  clubId?: string;
  /** Taken from the wallet, in pence. */
  amount: number;
  /** What the seller gets: credit value, or cash after the fee. */
  received: number;
  code?: string;
  at: string;
}

export interface LockerState {
  /** The fan signed in to The Locker app in the demo. */
  meId: string;
  /** The fan signed in on the club stores (null = signed out). Same Locker accounts as the app. */
  storeUserId: string | null;
  users: Record<string, User>;
  listings: Listing[];
  drafts: Draft[];
  orders: Order[];
  wallet: WalletEntry[];
  walletMoves: WalletMove[];
  credits: ClubCredit[];
  notifications: Notification[];
  conversations: Conversation[];
  reviews: Review[];
  kitlegit: KitLegitRecord[];
  demo: { nextVerdict: "authentic" | "counterfeit"; unsureId: boolean; expertVerdict: "authentic" | "counterfeit" };
}
