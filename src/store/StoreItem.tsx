import { ChevronLeft, Nfc, RotateCcw, ShieldCheck, Star, Truck, Wallet } from "lucide-react";
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
  const listing = s.listings.find((l) => l.id === id && l.clubId === club.id && (l.status === "live" || l.status === "sold"));
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
            <p className="text-3xl font-bold">{formatGBP(allInPrice(listing.price))}</p>
            <p className="text-sm text-neutral-500">
              Includes {formatGBP(buyerFee(listing.price))} buyer protection. Postage from £1.99.
            </p>
          </div>

          {listing.status === "sold" ? (
            <Button block disabled>
              Sold
            </Button>
          ) : user?.id === listing.sellerId ? (
            <p className="rounded-2xl bg-accent/5 p-4 text-sm font-medium">This is your listing. It's live here and in The Locker app.</p>
          ) : (
            <Button block onClick={() => (user ? navigate(`${base}/checkout/${listing.id}`) : requireSignIn(`${base}/checkout/${listing.id}`))}>
              Buy now
            </Button>
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

          <div className="flex items-center gap-3 border-t border-neutral-100 pt-4 text-sm">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 font-semibold">{seller.name[0]}</span>
            <div>
              <p className="font-semibold">Sold by {firstName(seller.name)}</p>
              <p className="flex items-center gap-1 text-xs text-neutral-500">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {seller.rating.toFixed(1)} · {seller.sales} sales ·{" "}
                {seller.city}
              </p>
            </div>
          </div>

          {listing.description && <p className="text-sm text-neutral-600">{listing.description}</p>}
        </div>
      </div>
    </div>
  );
}
