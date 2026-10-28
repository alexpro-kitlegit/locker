import { MessageCircle, Package, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShirtTile } from "../components/ListingCard";
import { OrderTimeline } from "../components/OrderTimeline";
import { BackHeader, Button, DemoButton, PrototypeControls, Row } from "../components/ui";
import { getClub } from "../data/clubs";
import { advanceOrder, cancelOrder, confirmReceived, dispatchDayPasses, orderListingIds, startRelist } from "../lib/actions";
import { ReviewPrompt } from "../components/seller";
import { firstName, releaseAt, sendBy, shirtTitle } from "../lib/format";
import { CARRIERS, formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";

const PAYOUT_LABEL = { club_credit: "Club credit", locker_balance: "Locker balance", bank: "Bank transfer" } as const;

const SIMULATE = {
  dispatched: "Simulate: carrier scans parcel",
  in_transit: "Simulate: delivered",
  delivered: "Simulate: 48 hours pass",
} as const;

export function OrderDetail() {
  const { id } = useParams();
  const s = useLocker();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<"closed" | "open" | "sent">("closed");
  const [cancelling, setCancelling] = useState(false);
  const order = s.orders.find((o) => o.id === id);
  if (!order) return <BackHeader title="Order not found" />;

  const listing = s.listings.find((l) => l.id === order.listingId)!;
  const selling = order.sellerId === s.meId;
  const other = s.users[selling ? order.buyerId : order.sellerId];
  const soldVia = order.channel === "club" ? `${getClub(order.clubId)!.name} store` : "The Locker app";
  const deliveredAt = order.events.find((e) => e.status === "delivered")?.at;
  const extras = orderListingIds(order).slice(1).map((lid) => s.listings.find((l) => l.id === lid)!);

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
            {extras.length > 0 && (
              <p className="text-xs text-neutral-500">
                Bundle: + {extras.map((x) => shirtTitle(x)).join(", ")}
                {order.bundleDiscount ? ` · ${order.bundleDiscount}% off` : ""}
              </p>
            )}
          </div>
        </div>

        {order.status === "cancelled" && order.cancellation && (
          <div className="rounded-2xl bg-neutral-100 p-4 text-sm">
            <p className="font-semibold">Cancelled</p>
            <p className="text-neutral-600">
              {order.cancellation.by === "seller" ? `${selling ? "You" : firstName(other.name)} cancelled it: ${order.cancellation.reason.toLowerCase()}.` : "It wasn't sent within 5 working days."}{" "}
              {selling ? "The buyer was refunded in full." : `You've been refunded ${formatGBP(order.total)}.`}
            </p>
          </div>
        )}

        {selling && order.status === "paid" && (
          <div className="space-y-3 rounded-2xl bg-locker-soft p-4">
            <p className="flex items-center gap-2 font-semibold">
              <Package className="h-5 w-5 text-locker" /> Sold! Send it by {sendBy(order.createdAt)}
            </p>
            <p className="text-sm text-neutral-600">
              {firstName(other.name)} chose {CARRIERS[order.carrier].name}. Your label is ready: show the QR code at the
              drop-off point, or print it. The money is held until it arrives.
            </p>
            <Button block onClick={() => navigate(`/app/orders/${order.id}/label`)}>
              Get your label
            </Button>
            {(order.dispatchReminders ?? 0) >= 3 && (
              <p className="text-xs font-semibold text-red-600">
                {order.dispatchReminders === 4 ? "Last day: send it today or the order is cancelled." : "Reminder: 2 working days left to send it."}
              </p>
            )}
            {cancelling ? (
              <div className="space-y-2 rounded-xl bg-white p-3">
                <p className="text-sm font-semibold">Why are you cancelling?</p>
                {["It's damaged", "I can't find it", "I sold it somewhere else", "Something else"].map((r) => (
                  <button key={r} onClick={() => cancelOrder(order.id, "seller", r)} className="block w-full rounded-lg bg-neutral-50 px-3 py-2 text-left text-sm">
                    {r}
                  </button>
                ))}
                <p className="text-xs text-neutral-500">The buyer is refunded in full. Cancellations show on your profile.</p>
              </div>
            ) : (
              <button onClick={() => setCancelling(true)} className="text-xs font-semibold text-neutral-500 underline">
                Can't send it? Cancel the sale
              </button>
            )}
          </div>
        )}

        {selling && order.status === "paid" && (
          <PrototypeControls title="Prototype: days pass without sending (reminders on days 3 and 4, cancelled on day 5)">
            <DemoButton onClick={() => dispatchDayPasses(order.id)}>Simulate: a working day passes (day {(order.dispatchReminders ?? 0) + 1})</DemoButton>
          </PrototypeControls>
        )}

        {selling && order.status === "delivered" && deliveredAt && (
          <p className="rounded-2xl bg-locker-soft p-4 text-sm">
            <span className="font-semibold">Delivered.</span> {firstName(other.name)} has 48 hours to check it. The money lands
            in your wallet on {releaseAt(deliveredAt)}.
          </p>
        )}

        {selling && order.status === "completed" && !order.payout && (
          <div className="space-y-3 rounded-2xl bg-locker-soft p-4">
            <p className="font-semibold">Completed. {formatGBP(order.itemPrice)} is in your wallet.</p>
            <Button block onClick={() => navigate(`/app/payout/${order.id}`)}>
              Keep it or move it
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

        {!selling && order.status === "delivered" && deliveredAt && (
          <div className="space-y-3 rounded-2xl bg-locker-soft p-4">
            <p className="font-semibold">Is everything OK?</p>
            <p className="text-sm text-neutral-600">
              You have until {releaseAt(deliveredAt)} to report a problem. After that, the order completes and{" "}
              {firstName(other.name)} is paid.
            </p>
            <Button block onClick={() => confirmReceived(order.id)}>
              Yes, all good
            </Button>
          </div>
        )}

        {!selling && order.status === "completed" && (
          <div className="space-y-3 rounded-2xl bg-ink p-4 text-sm text-white">
            <p className="flex gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              The KitLegit certificate {listing.check.certificate} is now in your name.
            </p>
            {!s.listings.some((l) => l.relistedFrom === listing.id) && (
              <button
                onClick={() => navigate(`/app/sell/${startRelist(s.meId, order.id, { surface: "app" })}`)}
                className="w-full rounded-full bg-white py-2 text-sm font-semibold text-ink"
              >
                Sell it again (we'll check it again first)
              </button>
            )}
          </div>
        )}

        {order.status === "completed" && <ReviewPrompt orderId={order.id} from={s.meId} to={other.id} />}

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
          <Button block variant="secondary" onClick={() => navigate(`/app/orders/${order.id}/label`)}>
            Show my label again
          </Button>
        )}

        {(order.status === "dispatched" || order.status === "in_transit" || order.status === "delivered") && (
          <PrototypeControls title="Prototype: carrier tracking and the 48-hour window">
            <DemoButton onClick={() => advanceOrder(order.id)}>{SIMULATE[order.status]}</DemoButton>
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
            {["It hasn't arrived", "It's damaged", "It isn't as described", "It's the wrong shirt", "I think it's fake"].map((r) => (
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
