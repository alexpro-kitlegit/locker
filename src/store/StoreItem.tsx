import { ChevronLeft, MessageCircle, Nfc, RotateCcw, ShieldCheck, Star, Truck, Wallet } from "lucide-react";
import { useState } from "react";
import { OfferComposer } from "../components/Inbox";
import { ManageListing } from "../components/seller";
import { makeOffer, openConversation } from "../lib/actions";
import { completedSales, isVisible, priceFor, rating, reservedForOther } from "../lib/reputation";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ShirtTile } from "../components/ListingCard";
import { Button } from "../components/ui";
import { firstName, formatDate, shirtTitle } from "../lib/format";
import { allInPrice, buyerFee, formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";
import { useStore } from "./StoreLayout";

export function StoreItem() {
  const { id } = useParams();
  const { club, user, requireSignIn } = useStore();
  const s = useLocker();
  const navigate = useNavigate();
  const [offering, setOffering] = useState(false);
  // Sellers can open their own listing here whatever its status; buyers see live and sold shirts.
  const listing = s.listings.find(
    (l) => l.id === id && l.clubId === club.id && (isVisible(s, l) || l.status === "sold" || l.sellerId === user?.id),
  );
  const base = `/store/${club.id}`;

  if (!listing)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <p className="text-neutral-500">This shirt isn't available.</p>
        <Link to={base} className="mt-3 inline-block font-semibold text-accent">
          Back to the store
        </Link>
      </div>
    );

  const seller = s.users[listing.sellerId];
  const r = rating(s, seller.id);
  const mine = user?.id === listing.sellerId;
  const myPrice = priceFor(listing, user?.id);
  const held = reservedForOther(listing, user?.id);
  const signedIn = (then: () => void) => (user ? then() : requireSignIn());

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Link to={base} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> All shirts
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <ShirtTile listing={listing} className="rounded-3xl" />

        <div className="space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {shirtTitle(listing)} shirt · {listing.size}
            </h1>
            <p className="text-neutral-500">
              {listing.condition}
              {listing.printing && ` · ${listing.printing}`}
            </p>
          </div>

          <div>
            <p className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{formatGBP(allInPrice(myPrice))}</span>
              {listing.previousPrice && <span className="text-neutral-400 line-through">{formatGBP(allInPrice(listing.previousPrice))}</span>}
              {myPrice !== listing.price && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">Your offer</span>}
            </p>
            <p className="text-sm text-neutral-500">
              Includes {formatGBP(buyerFee(myPrice))} buyer protection. Postage from £1.99.
            </p>
          </div>

          {listing.status === "sold" ? (
            <Button block disabled>
              Sold
            </Button>
          ) : mine ? (
            <ManageListing listing={listing} />
          ) : (
            <div className="space-y-2">
              {held ? (
                <Button block disabled>
                  Reserved for another buyer
                </Button>
              ) : (
                <Button block onClick={() => (user ? navigate(`${base}/checkout/${listing.id}`) : requireSignIn(`${base}/checkout/${listing.id}`))}>
                  Buy now
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" disabled={held} onClick={() => signedIn(() => setOffering(true))}>
                  Make an offer
                </Button>
                <Button variant="secondary" onClick={() => signedIn(() => navigate(`${base}/inbox/${openConversation(listing.id, user!.id)}`))}>
                  <MessageCircle className="h-4 w-4" /> Ask a question
                </Button>
              </div>
              {offering && user && (
                <OfferComposer
                  listingPrice={listing.price}
                  onCancel={() => setOffering(false)}
                  onSend={(amount) => {
                    const conv = openConversation(listing.id, user.id);
                    makeOffer(conv, user.id, amount);
                    navigate(`${base}/inbox/${conv}`);
                  }}
                />
              )}
            </div>
          )}

          <div className="rounded-2xl bg-ink p-4 text-white">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5" /> Authentic. Checked by KitLegit
            </p>
            <p className="mt-1 text-sm text-white/70">
              Certificate {listing.check.certificate}, checked {formatDate(listing.check.checkedAt)}. Labels and codes
              matched {listing.check.labels}. The certificate moves to you when it arrives.
            </p>
            {listing.nfcTag && (
              <p className="mt-3 flex items-center gap-2 text-sm">
                <Nfc className="h-4 w-4" /> Comes with a FanNFC tag. Tap it to prove it's this shirt.
              </p>
            )}
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <Wallet className="h-4 w-4 shrink-0 text-accent" /> We hold your money until the shirt arrives.
            </li>
            <li className="flex gap-2">
              <Truck className="h-4 w-4 shrink-0 text-accent" /> Tracked delivery with InPost, Evri or Royal Mail.
            </li>
            <li className="flex gap-2">
              <RotateCcw className="h-4 w-4 shrink-0 text-accent" /> Not as described? You get your money back.
            </li>
          </ul>

          <Link to={`${base}/seller/${seller.id}`} className="flex items-center gap-3 border-t border-neutral-100 pt-4 text-sm">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 font-semibold">{seller.name[0]}</span>
            <div>
              <p className="font-semibold">Sold by {seller.seller.businessName ?? firstName(seller.name)}</p>
              <p className="flex items-center gap-1 text-xs text-neutral-500">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {r.count ? `${r.avg.toFixed(1)} (${r.count})` : "New seller"} ·{" "}
                {seller.sales + completedSales(s, seller.id)} sales · {seller.city}
              </p>
            </div>
          </Link>

          {listing.description && <p className="text-sm text-neutral-600">{listing.description}</p>}
        </div>
      </div>
    </div>
  );
}
