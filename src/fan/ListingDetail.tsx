import { ChevronRight, MessageCircle, Nfc, ShieldCheck, Star } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { OfferComposer } from "../components/Inbox";
import { ShirtTile } from "../components/ListingCard";
import { ManageListing } from "../components/seller";
import { BackHeader, Button, Crest, DemoButton, PrototypeControls, TickCircle } from "../components/ui";
import { getClub } from "../data/clubs";
import { makeOffer, openConversation } from "../lib/actions";
import { formatDate, shirtTitle } from "../lib/format";
import { allInPrice, buyerFee, formatGBP } from "../lib/pricing";
import { priceFor, rating, reservedForOther } from "../lib/reputation";
import { useLocker } from "../lib/store";

export function ListingDetail() {
  const { id } = useParams();
  const s = useLocker();
  const navigate = useNavigate();
  const [tapped, setTapped] = useState(false);
  const [offering, setOffering] = useState(false);
  const listing = s.listings.find((l) => l.id === id);
  if (!listing) return <BackHeader title="Listing not found" />;

  const club = getClub(listing.clubId)!;
  const seller = s.users[listing.sellerId];
  const r = rating(s, seller.id);
  const mine = listing.sellerId === s.meId;
  const order = s.orders.find((o) => o.listingId === listing.id || o.extraListingIds?.includes(listing.id));
  const myPrice = priceFor(listing, s.meId);
  const held = reservedForOther(listing, s.meId);
  const ask = () => navigate(`/app/inbox/${openConversation(listing.id, s.meId)}`);

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
          <p className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold">{formatGBP(allInPrice(myPrice))}</span>
            {listing.previousPrice && <span className="text-sm text-neutral-400 line-through">{formatGBP(allInPrice(listing.previousPrice))}</span>}
            {myPrice !== listing.price && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">Your offer</span>}
          </p>
          <p className="text-xs text-neutral-500">Includes {formatGBP(buyerFee(myPrice))} buyer protection. Postage from £1.99.</p>
        </div>

        {mine && <ManageListing listing={listing} />}

        {!mine && listing.status === "live" && (
          <div className="space-y-2">
            {held ? (
              <Button block disabled>
                Reserved for another buyer
              </Button>
            ) : (
              <Button block onClick={() => navigate(`/app/checkout/${listing.id}`)}>
                Buy now
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setOffering(true)} disabled={held}>
                Make an offer
              </Button>
              <Button variant="secondary" onClick={ask}>
                <MessageCircle className="h-4 w-4" /> Ask a question
              </Button>
            </div>
            {offering && (
              <OfferComposer
                listingPrice={listing.price}
                onCancel={() => setOffering(false)}
                onSend={(amount) => {
                  const conv = openConversation(listing.id, s.meId);
                  makeOffer(conv, s.meId, amount);
                  navigate(`/app/inbox/${conv}`);
                }}
              />
            )}
          </div>
        )}
        {!mine && listing.status === "sold" &&
          (order && order.buyerId === s.meId ? (
            <Button block variant="secondary" onClick={() => navigate(`/app/orders/${order.id}`)}>
              View order {order.id}
            </Button>
          ) : (
            <Button block disabled>
              Sold
            </Button>
          ))}

        <div className="rounded-2xl bg-ink p-4 text-white">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-5 w-5" /> Checked by KitLegit
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <Stat label="Result" value={listing.check.verdict === "authentic" ? "Authentic" : "—"} />
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

        <Link to={`/app/seller/${seller.id}`} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 font-semibold">{seller.name[0]}</span>
          <div className="flex-1 text-sm">
            <p className="font-semibold">{mine ? "You" : seller.seller.businessName ?? seller.name}</p>
            <p className="flex items-center gap-1 text-xs text-neutral-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {r.count ? `${r.avg.toFixed(1)} (${r.count})` : "New seller"} · {seller.city}
              {seller.seller.bundleDiscount > 0 && !mine && ` · ${seller.seller.bundleDiscount}% off bundles`}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        </Link>

        {listing.description && <p className="text-sm text-neutral-600">{listing.description}</p>}
        <p className="text-xs text-neutral-500">{club.partner ? `Also in the ${club.name} store.` : "In The Locker app only."}</p>
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
