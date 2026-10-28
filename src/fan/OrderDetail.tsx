import { MessageCircle, Package, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShirtTile } from "../components/ListingCard";
import { OrderTimeline } from "../components/OrderTimeline";
import { QrCode } from "../components/QrCode";
import { BackHeader, Button, DemoButton, PrototypeControls, Row } from "../components/ui";
import { getClub } from "../data/clubs";
import { advanceOrder } from "../lib/actions";
import { firstName, shirtTitle } from "../lib/format";
import { CARRIERS, formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";

const PAYOUT_LABEL = { club_credit: "Club credit", locker_balance: "Locker balance", bank: "Bank transfer" } as const;

export function OrderDetail() {
  const { id } = useParams();
  const s = useLocker();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<"closed" | "open" | "sent">("closed");
  const order = s.orders.find((o) => o.id === id);
  if (!order) return <BackHeader title="Order not found" />;

  const listing = s.listings.find((l) => l.id === order.listingId)!;
  const selling = order.sellerId === s.meId;
  const other = s.users[selling ? order.buyerId : order.sellerId];
  const soldVia = order.channel === "club" ? `${getClub(order.clubId)!.name} store` : "The Locker app";

  return (
    <div className="pb-6">
      <BackHeader title={`Order ${order.id}`} />
      <div className="space-y-5 px-4">
        <div className="flex gap-3">
          <ShirtTile listing={listing} compact className="w-20 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">
              {shirtTitle(listing)} · {listing.size}
            </p>
            <p className="text-neutral-500">
              {selling ? `Sold to ${firstName(other.name)} via ${soldVia}` : `From ${firstName(other.name)}`}
            </p>
            <p className="mt-1 font-bold">{formatGBP(selling ? order.itemPrice : order.total)}</p>
          </div>
        </div>

        {selling && order.status === "paid" && (
          <div className="space-y-3 rounded-2xl bg-locker-soft p-4">
            <p className="flex items-center gap-2 font-semibold">
              <Package className="h-5 w-5 text-locker" /> Sold! Send it within 3 days
            </p>
            <p className="text-sm text-neutral-600">
              A quick dispatch check, then drop it at an {CARRIERS[order.carrier].name} point with a QR code. No printer
              needed. The buyer's money is held until it arrives.
            </p>
            <Button block onClick={() => navigate(`/app/orders/${order.id}/dispatch`)}>
              Send it
            </Button>
          </div>
        )}

        {selling && order.status === "delivered" && !order.payout && (
          <div className="space-y-3 rounded-2xl bg-locker-soft p-4">
            <p className="font-semibold">Delivered. Your money is ready.</p>
            <Button block onClick={() => navigate(`/app/payout/${order.id}`)}>
              Choose how you're paid
            </Button>
          </div>
        )}

        {selling && order.payout && (
          <div className="rounded-2xl border border-neutral-200 px-4">
            <Row label="Paid out as" value={PAYOUT_LABEL[order.payout.method]} />
            <Row label="Amount" value={formatGBP(order.payout.amount)} />
            {order.payout.code && <Row label="Credit code" value={order.payout.code} />}
          </div>
        )}

        {!selling && order.status === "delivered" && (
          <div className="flex gap-3 rounded-2xl bg-ink p-4 text-sm text-white">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <p>
              The KitLegit certificate {listing.check.certificate} is now in your name. If you sell it later, it's
              already checked.
            </p>
          </div>
        )}

        <section>
          <h2 className="mb-3 text-sm font-bold">Tracking</h2>
          <OrderTimeline order={order} />
          {order.tracking && (
            <p className="text-xs text-neutral-500">
              {CARRIERS[order.carrier].name} · {order.tracking}
            </p>
          )}
        </section>

        {selling && order.status === "dispatched" && (
          <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 p-3">
            <QrCode seed={order.id} className="h-20 w-20" />
            <p className="text-xs text-neutral-500">Drop-off code for {order.dropOff}</p>
          </div>
        )}

        {(order.status === "dispatched" || order.status === "in_transit") && (
          <PrototypeControls title="Prototype: carrier tracking (ShipStation)">
            <DemoButton onClick={() => advanceOrder(order.id)}>
              {order.status === "dispatched" ? "Simulate: carrier scans parcel" : "Simulate: delivered"}
            </DemoButton>
          </PrototypeControls>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary">
            <MessageCircle className="h-4 w-4" /> Message {firstName(other.name)}
          </Button>
          <Button variant="secondary" onClick={() => setProblem("open")}>
            Report a problem
          </Button>
        </div>

        {problem === "open" && (
          <div className="space-y-3 rounded-2xl border border-neutral-200 p-4 text-sm">
            <p className="font-semibold">What's wrong?</p>
            {["It hasn't arrived", "It isn't as described", "Something else"].map((r) => (
              <button key={r} onClick={() => setProblem("sent")} className="block w-full rounded-xl bg-neutral-50 px-3 py-2.5 text-left">
                {r}
              </button>
            ))}
          </div>
        )}
        {problem === "sent" && (
          <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
            Thanks. The money stays held while a person from our team looks at it, usually within 24 hours.
          </p>
        )}
      </div>
    </div>
  );
}
