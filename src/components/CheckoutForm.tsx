import clsx from "clsx";
import { Apple, CreditCard, Landmark, Loader2, Lock, MapPin, Wallet } from "lucide-react";
import { useState, type ReactNode } from "react";
import { placeOrder } from "../lib/actions";
import { shirtTitle } from "../lib/format";
import { buyerFee, CARRIERS, formatGBP, PRINT_ONLY } from "../lib/pricing";
import { priceFor } from "../lib/reputation";
import { useLocker } from "../lib/store";
import { walletBalance } from "../lib/wallet";
import type { Carrier, Listing, Order, PaymentMethod } from "../lib/types";
import { ShirtTile } from "./ListingCard";
import { Button, CheckedBadge } from "./ui";

const DROP_OFF: Record<Carrier, string> = {
  inpost: "InPost Locker · Tesco Extra, Harbour Rd",
  evri: "Evri ParcelShop · Costcutter, Mill Lane",
  royal_mail: "Home delivery · 14 Alder Close",
  dpd: "DPD Pickup · Spar, Station Rd",
};

/**
 * Shared checkout for The Locker app and club stores (the accent colour comes from the surface). Takes one shirt,
 * or a bundle of shirts from one seller with the seller's bundle discount. An accepted offer sets the price.
 */
export function CheckoutForm({
  listings,
  buyerId,
  channel,
  clubId,
  header,
  onPlaced,
}: {
  listings: Listing[];
  buyerId: string;
  channel: Order["channel"];
  clubId?: string;
  header?: ReactNode;
  onPlaced: (orderId: string) => void;
}) {
  const s = useLocker();
  const lockerBalance = walletBalance(s, buyerId);
  const seller = s.users[listings[0].sellerId];
  const carriers = (Object.keys(CARRIERS) as Carrier[]).filter((c) => !(seller.seller.noPrinter && PRINT_ONLY.includes(c)));
  const [carrier, setCarrier] = useState<Carrier>("inpost");
  const [payment, setPayment] = useState<PaymentMethod>("pay_by_bank");
  const [paying, setPaying] = useState(false);

  const listPrice = listings.reduce((a, l) => a + priceFor(l, buyerId), 0);
  const discount = listings.length > 1 ? seller.seller.bundleDiscount : 0;
  const itemPrice = Math.round(listPrice * (1 - discount / 100));
  const offer = listings.length === 1 && priceFor(listings[0], buyerId) !== listings[0].price;
  const fee = buyerFee(itemPrice);
  const postage = CARRIERS[carrier].price;
  const total = itemPrice + fee + postage;
  const canUseBalance = channel === "app" && lockerBalance >= total;

  const pay = () => {
    setPaying(true);
    // Stands in for Stripe (Pay by Bank / card / Apple Pay) and the redirect back.
    setTimeout(() => {
      const id = placeOrder({ listingIds: listings.map((l) => l.id), buyerId, channel, clubId, paymentMethod: payment, carrier, dropOff: DROP_OFF[carrier] });
      onPlaced(id);
    }, 1400);
  };

  const payments: { id: PaymentMethod; label: string; detail: string; icon: ReactNode; tag?: string; hidden?: boolean }[] = [
    { id: "pay_by_bank", label: "Pay by bank", detail: "Straight from your banking app. No card needed.", icon: <Landmark className="h-4 w-4" />, tag: "Recommended" },
    { id: "card", label: "Card", detail: "Visa, Mastercard, Amex", icon: <CreditCard className="h-4 w-4" /> },
    { id: "apple_pay", label: "Apple Pay", detail: "Pay with Face ID", icon: <Apple className="h-4 w-4" /> },
    {
      id: "locker_balance",
      label: "Your wallet",
      detail: `${formatGBP(lockerBalance)} available`,
      icon: <Wallet className="h-4 w-4" />,
      hidden: channel !== "app" || lockerBalance === 0,
    },
  ];

  return (
    <div className="space-y-5">
      {header}
      {listings.length > 1 && (
        <p className="rounded-2xl bg-accent/5 p-3 text-sm">
          <span className="font-semibold">Bundle of {listings.length} from {seller.name.split(" ")[0]}.</span> One parcel, one postage
          {discount > 0 ? `, and ${discount}% off the shirts` : ""}.
        </p>
      )}
      {listings.map((listing) => (
        <div key={listing.id} className="flex gap-3 rounded-2xl border border-neutral-200 p-3">
          <ShirtTile listing={listing} compact className="w-20 shrink-0" />
          <div className="min-w-0 space-y-1">
            <p className="font-semibold">
              {shirtTitle(listing)} · {listing.size}
            </p>
            <p className="text-xs text-neutral-500">{listing.condition}</p>
            <CheckedBadge />
          </div>
        </div>
      ))}

      <Section title="Delivery">
        {carriers.map((c) => (
          <Choice key={c} selected={carrier === c} onClick={() => setCarrier(c)}>
            <div className="flex-1">
              <p className="text-sm font-semibold">{CARRIERS[c].name}</p>
              <p className="text-xs text-neutral-500">
                {CARRIERS[c].detail} · {CARRIERS[c].eta}
              </p>
            </div>
            <span className="text-sm font-semibold">{formatGBP(CARRIERS[c].price)}</span>
          </Choice>
        ))}
        <p className="flex items-center gap-1.5 px-1 pt-1 text-xs text-neutral-500">
          <MapPin className="h-3.5 w-3.5" /> {DROP_OFF[carrier]}
          <span className="ml-auto font-semibold text-accent">Change</span>
        </p>
      </Section>

      <Section title="Payment">
        {payments
          .filter((p) => !p.hidden)
          .map((p) => (
            <Choice
              key={p.id}
              selected={payment === p.id}
              disabled={p.id === "locker_balance" && !canUseBalance}
              onClick={() => setPayment(p.id)}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100">{p.icon}</span>
              <div className="flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {p.label}
                  {p.tag && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">{p.tag}</span>}
                </p>
                <p className="text-xs text-neutral-500">{p.detail}</p>
              </div>
            </Choice>
          ))}
      </Section>

      <Section title="Summary">
        <div className="rounded-2xl bg-neutral-50 p-3 text-sm">
          <Line label={listings.length > 1 ? `${listings.length} shirts` : offer ? "Shirt (your accepted offer)" : "Shirt"} value={formatGBP(listPrice)} />
          {discount > 0 && <Line label={`Bundle discount (${discount}%)`} value={`−${formatGBP(listPrice - itemPrice)}`} />}
          <Line label="Buyer protection" value={formatGBP(fee)} />
          <Line label={`Postage (${CARRIERS[carrier].name})`} value={formatGBP(postage)} />
          <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatGBP(total)}</span>
          </div>
        </div>
      </Section>

      <Button block onClick={pay} disabled={paying}>
        {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {paying ? "Confirming payment…" : `Pay ${formatGBP(total)}`}
      </Button>
      <p className="text-center text-xs text-neutral-500">
        We hold your money until the shirt arrives. If it isn't as described, you get it back.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-bold">{title}</h3>
      {children}
    </section>
  );
}

function Choice({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-40",
        selected ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-neutral-200 hover:border-neutral-300",
      )}
    >
      <span className={clsx("grid h-4 w-4 shrink-0 place-items-center rounded-full border-2", selected ? "border-accent" : "border-neutral-300")}>
        {selected && <span className="h-2 w-2 rounded-full bg-accent" />}
      </span>
      {children}
    </button>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 text-neutral-600">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
