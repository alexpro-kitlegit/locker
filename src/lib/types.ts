export type ShirtType = "Home" | "Away" | "Third" | "Goalkeeper";
export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export type Condition = "Brand new" | "Excellent" | "Good" | "Fair";
export type KitVersion = "Stadium" | "Player" | "Not sure";

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

/** KitLegit's photo slots (kitlegit-web src/lib/checkTypes.ts). */
export type SlotId =
  | "front"
  | "back"
  | "neck-label"
  | "wash-label"
  | "style-code"
  | "security-label"
  | "hologram"
  | "swing-tag"
  | "other";

/** KitLegit's slot statuses, cut down to what a seller can set. */
export type SlotStatus = "uploaded" | "not-present" | "removed" | "damaged";

export interface SlotPhoto {
  status: SlotStatus;
  /** Small data-URL preview. The real app uploads the full photo to storage. */
  thumb?: string;
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

/** A listing in progress. It can start in a club store and finish in the app, or the other way round. */
export interface Draft {
  id: string;
  ownerId: string;
  startedOn: { surface: "app" | "store"; clubId?: string };
  shirt?: { clubId: string; type: ShirtType; season: string };
  slots: Partial<Record<SlotId, SlotPhoto>>;
  step: "photos" | "review" | "details" | "price";
  size?: Size;
  condition?: Condition;
  version?: KitVersion;
  printing?: string;
  price?: number;
  updatedAt: string;
}

export type OrderStatus = "paid" | "dispatched" | "in_transit" | "delivered";
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
  dispatchCheckId?: string;
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
  demo: { nextVerdict: "authentic" | "counterfeit" };
}
