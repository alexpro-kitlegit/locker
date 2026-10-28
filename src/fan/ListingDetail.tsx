import { Nfc, ShieldCheck, Star } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ShirtTile } from "../components/ListingCard";
import { BackHeader, Button, Crest, DemoButton, PrototypeControls, Row, TickCircle } from "../components/ui";
import { getClub } from "../data/clubs";
import { formatDate, shirtTitle } from "../lib/format";
import { allInPrice, buyerFee, formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";

export function ListingDetail() {
  const { id } = useParams();
  const s = useLocker();
  const navigate = useNavigate();
  const [tapped, setTapped] = useState(false);
  const listing = s.listings.find((l) => l.id === id);
  if (!listing) return <BackHeader title="Listing not found" />;

  const club = getClub(listing.clubId)!;
  const seller = s.users[listing.sellerId];
  const mine = listing.sellerId === s.meId;
  const order = s.orders.find((o) => o.listingId === listing.id);

  return (
    <div className="pb-6">
      <BackHeader />
      <div className="space-y-5 px-4">
        <ShirtTile listing={listing} />

        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Crest club={club} className="h-4 w-4" /> {club.name}
          </p>
          <h1 className="text-xl font-bold">
            {shirtTitle(listing)} · {listing.size}
          </h1>
          <p className="text-sm text-neutral-500">
            {listing.condition}
            {listing.printing && ` · ${listing.printing}`}
          </p>
          <p className="pt-1 text-2xl font-bold">{formatGBP(allInPrice(listing.price))}</p>
          <p className="text-xs text-neutral-500">
            Includes {formatGBP(buyerFee(listing.price))} buyer protection. Postage from £1.99.
          </p>
        </div>

        <div className="rounded-2xl bg-ink p-4 text-white">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-5 w-5" /> Checked by KitLegit
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <Stat label="Result" value="Authentic" />
            <Stat label="Certificate" value={listing.check.certificate ?? "—"} />
            <Stat label="Checked" value={formatDate(listing.check.checkedAt)} />
          </div>
          <p className="mt-3 text-xs text-white/70">The certificate moves to the buyer when the shirt arrives.</p>
        </div>

        {listing.nfcTag && (
          <div className="space-y-3 rounded-2xl border border-neutral-200 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Nfc className="h-5 w-5 text-locker" /> FanNFC tag {listing.nfcTag}
            </p>
            <p className="text-xs text-neutral-500">Tap your phone on the tag to prove it's the shirt KitLegit checked.</p>
            {tapped ? (
              <div className="flex items-center gap-2 rounded-xl bg-locker-soft p-3 text-sm font-medium">
                <TickCircle tone="locker" /> Tag matches certificate {listing.check.certificate}
              </div>
            ) : (
              <PrototypeControls title="Prototype">
                <DemoButton onClick={() => setTapped(true)}>Simulate tapping the tag</DemoButton>
              </PrototypeControls>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-neutral-200 px-4">
          <Row
            label="Seller"
            value={
              <span className="flex items-center gap-1">
                {mine ? "You" : seller.name}
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {seller.rating.toFixed(1)}
              </span>
            }
          />
          <Row label="Ships from" value={seller.city} />
          <Row label="Also in" value={club.partner ? `${club.name} store` : "The Locker app only"} />
        </div>

        {listing.description && <p className="text-sm text-neutral-600">{listing.description}</p>}

        {listing.status === "sold" ? (
          order && (mine || order.buyerId === s.meId) ? (
            <Button block variant="secondary" onClick={() => navigate(`/app/orders/${order.id}`)}>
              View order {order.id}
            </Button>
          ) : (
            <Button block disabled>
              Sold
            </Button>
          )
        ) : mine ? (
          <div className="rounded-2xl bg-locker-soft p-4 text-sm">
            <p className="font-semibold">
              {listing.status === "in_review" ? "Getting your listing ready" : listing.status === "rejected" ? "We couldn't list this shirt" : "This is your listing"}
            </p>
            {listing.status === "live" && (
              <p className="text-neutral-600">
                Live in The Locker
                {club.partner && (
                  <>
                    {" "}and the{" "}
                    <Link to={`/store/${club.id}/item/${listing.id}`} className="font-semibold text-locker underline" target="_top">
                      {club.name} store
                    </Link>
                  </>
                )}
                .
              </p>
            )}
            {listing.status === "in_review" && <p className="text-neutral-600">We're checking a few details. We'll let you know when it's live.</p>}
            {listing.status === "rejected" && <p className="text-neutral-600">Our authentication team couldn't approve it. You haven't been charged.</p>}
          </div>
        ) : (
          <Button block onClick={() => navigate(`/app/checkout/${listing.id}`)}>
            Buy now
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/60">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
