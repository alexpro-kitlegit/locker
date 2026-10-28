import { ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ShirtTile } from "../components/ListingCard";
import { OrderTimeline } from "../components/OrderTimeline";
import { Button, LockerLogo, TickCircle } from "../components/ui";
import { ReviewPrompt } from "../components/seller";
import { confirmReceived } from "../lib/actions";
import { firstName, sendBy, shirtTitle } from "../lib/format";
import { CARRIERS, formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";
import { useClub } from "./StoreLayout";

export function StoreOrder() {
  const { orderId } = useParams();
  const club = useClub();
  const s = useLocker();
  const order = s.orders.find((o) => o.id === orderId);
  if (!order) return null;

  const listing = s.listings.find((l) => l.id === order.listingId)!;
  const buyer = s.users[order.buyerId];
  const seller = s.users[order.sellerId];

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2 text-center">
        <TickCircle size="lg" tone="accent" className="mx-auto" />
        <h1 className="text-2xl font-bold">
          {order.status === "delivered" || order.status === "completed" ? "It's arrived" : `Thanks, ${firstName(buyer.name)}`}
        </h1>
        <p className="text-sm text-neutral-500">
          Order {order.id}.{" "}
          {order.status === "paid" ? `${firstName(seller.name)} will send it by ${sendBy(order.createdAt)}.` : `Sent with ${CARRIERS[order.carrier].name}.`}
        </p>
      </div>

      <div className="flex gap-3 rounded-2xl border border-neutral-200 p-3">
        <ShirtTile listing={listing} compact className="w-20 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">
            {club.name} {shirtTitle(listing)} · {listing.size}
          </p>
          <p className="text-neutral-500">To {order.dropOff}</p>
          <p className="mt-1 font-bold">{formatGBP(order.total)} paid</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold">Tracking</h2>
        <OrderTimeline order={order} />
      </section>

      <div className="flex gap-3 rounded-2xl bg-ink p-4 text-sm text-white">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <p>
          {order.status === "completed"
            ? `KitLegit certificate ${listing.check.certificate} is now in your name.`
            : `We hold your money until it arrives. Then KitLegit certificate ${listing.check.certificate} moves to you.`}
        </p>
      </div>

      {order.status === "delivered" && (
        <div className="space-y-2 rounded-2xl bg-accent/5 p-4 text-sm">
          <p className="font-semibold">Is everything OK?</p>
          <p className="text-neutral-600">You have 48 hours to report a problem. After that, {firstName(seller.name)} is paid.</p>
          <Button block onClick={() => confirmReceived(order.id)}>
            Yes, all good
          </Button>
        </div>
      )}
      {order.status === "cancelled" && (
        <p className="rounded-2xl bg-neutral-100 p-4 text-sm">
          <span className="font-semibold">Cancelled.</span> You've been refunded {formatGBP(order.total)}.
        </p>
      )}
      {order.status === "completed" && <ReviewPrompt orderId={order.id} from={buyer.id} to={seller.id} />}

      <div className="rounded-2xl bg-neutral-50 p-4 text-center text-sm">
        <p>
          Track it, message the seller and keep your certificate in <LockerLogo className="text-sm" />
        </p>
        <Link to="/app" target="_top" className="mt-2 inline-block font-semibold text-accent">
          Get the app
        </Link>
      </div>
    </div>
  );
}
