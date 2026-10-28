export type ShirtType = "Home" | "Away" | "Third" | "Goalkeeper";
export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export type Condition = "Brand new" | "Excellent" | "Good" | "Fair";

export type KitPattern = "plain" | "stripes" | "hoops" | "sash" | "halves";
export interface Kit {
  body: string;
  trim: string;
  pattern: KitPattern;
  patternColor?: string;
}

export type TemplateId = "classic" | "bold" | "minimal";
export type CreditMethod = "shopify" | "codes" | "own_shop";

export interface Club {
  id: string;
  name: string;
  initials: string;
  domain: string;
  shopDomain: string;
  primary: string;
  secondary: string;
  onPrimary: string;
  template: TemplateId;
  creditMethod: CreditMethod;
  kits: Record<ShirtType, Kit>;
}

export interface User {
  id: string;
  name: string;
  clubId: string;
  city: string;
  rating: number;
  sales: number;
}

/** A KitLegit check, as The Locker sees it. Maps to KitLegit's checks + current_effective_results + certificates. */
export interface KitLegitCheck {
  id: string;
  verdict: "authentic" | "counterfeit";
  certificate?: string;
  labels: string;
  checkedAt: string;
}

export type ListingStatus = "live" | "sold" | "withdrawn";

export interface Listing {
  id: string;
  clubId: string;
  type: ShirtType;
  season: string;
  size: Size;
  condition: Condition;
  /** What the seller gets, in pence. The buyer pays this plus the buyer fee. */
  price: number;
  sellerId: string;
  status: ListingStatus;
  createdAt: string;
  check: KitLegitCheck;
  nfcTag?: string;
  printing?: string;
  description?: string;
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
  /** The fan using The Locker app in the demo. */
  meId: string;
  /** The fan buying in the club stores in the demo. */
  storeBuyerId: string;
  users: Record<string, User>;
  listings: Listing[];
  orders: Order[];
  lockerBalance: number;
  credits: ClubCredit[];
  demo: { nextVerdict: "authentic" | "counterfeit" };
}
