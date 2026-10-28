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
  rating: number;
  sales: number;
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

/** in_review: the KitLegit check is running in the background. The seller is just told it's being prepared. */
export type ListingStatus = "in_review" | "live" | "rejected" | "sold" | "withdrawn";

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
  updatedAt: string;
}

/** completed: 48 hours after delivery with no problem reported (or the buyer said it's all good). Money is released. */
export type OrderStatus = "paid" | "dispatched" | "in_transit" | "delivered" | "completed";
export type Carrier = "inpost" | "evri" | "royal_mail";
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
  listingId: string;
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
  createdAt: string;
}

export interface ClubCredit {
  id: string;
  clubId: string;
  code: string;
  amount: number;
  orderId: string;
  issuedAt: string;
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
  /** "Spend in The Locker" balance per user, in pence. */
  balances: Record<string, number>;
  /** Club credit codes. The owner is the seller on the linked order. */
  credits: ClubCredit[];
  demo: { nextVerdict: "authentic" | "counterfeit"; unsureId: boolean };
}
