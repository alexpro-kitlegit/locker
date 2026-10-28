import clsx from "clsx";
import { BadgeCheck, Check, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getClub } from "../data/clubs";
import { formatDate } from "../lib/format";
import { allInPrice, formatGBP } from "../lib/pricing";
import { badges, CANCELLATION_WINDOW_DAYS, completedSales, isVisible, rating, sellerCancellations } from "../lib/reputation";
import type { SurfaceRoutes } from "../lib/routes";
import { useLocker } from "../lib/store";
import { ListingCard, ShirtTile } from "./ListingCard";
import { Button, Crest, SectionTitle } from "./ui";

/**
 * A seller's public profile: rating, badges, reviews, cancellations and their live shirts.
 * Buyers can pick several shirts to buy as one bundle (one parcel, one postage, the seller's bundle discount).
 */
export function SellerProfile({ userId, viewerId, routes, onlyClubId }: { userId: string; viewerId?: string; routes: SurfaceRoutes; onlyClubId?: string }) {
  const s = useLocker();
  const u = s.users[userId];
  const r = rating(s, userId);
  const reviews = s.reviews.filter((x) => x.to === userId);
  const listings = s.listings.filter((l) => l.sellerId === userId && isVisible(s, l) && (!onlyClubId || l.clubId === onlyClubId));
  const [bundle, setBundle] = useState<string[] | null>(null);
  const mine = viewerId === userId;
  const total = (bundle ?? []).reduce((a, id) => a + s.listings.find((l) => l.id === id)!.price, 0);
  const discount = (bundle?.length ?? 0) > 1 ? u.seller.bundleDiscount : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-xl font-bold text-on-accent">
          {u.name.split(" ").map((p) => p[0]).join("")}
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{u.seller.type === "business" && u.seller.businessName ? u.seller.businessName : u.name}</h1>
          <p className="flex items-center gap-1 text-sm text-neutral-600">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {r.count ? `${r.avg.toFixed(1)} (${r.count} reviews)` : "No reviews yet"} · {u.sales + completedSales(s, userId)} sales
          </p>
          <p className="flex items-center gap-1 text-xs text-neutral-500">
            <Crest club={getClub(u.clubId)!} className="h-3.5 w-3.5" /> {u.city} · on The Locker since {new Date(u.joinedAt).getFullYear()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {badges(s, userId).map((b) => (
          <span key={b} className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
            <BadgeCheck className="h-3.5 w-3.5" /> {b}
          </span>
        ))}
        {sellerCancellations(s, userId) > 0 && (
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
            Cancelled {sellerCancellations(s, userId)} {sellerCancellations(s, userId) === 1 ? "sale" : "sales"} in the last {CANCELLATION_WINDOW_DAYS} days
          </span>
        )}
        {u.seller.holiday && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">On holiday</span>}
      </div>

      <section>
        <SectionTitle
          action={
            !mine &&
            listings.length > 1 &&
            (bundle ? (
              <button onClick={() => setBundle(null)} className="text-xs font-semibold text-neutral-500">
                Cancel
              </button>
            ) : (
              <button onClick={() => setBundle([])} className="text-xs font-semibold text-accent">
                Bundle{u.seller.bundleDiscount ? `: ${u.seller.bundleDiscount}% off 2+` : ""}
              </button>
            ))
          }
        >
          {listings.length} shirts for sale
        </SectionTitle>
        {bundle && <p className="mb-2 text-xs text-neutral-500">Pick the shirts you want. One parcel, one postage.</p>}
        {listings.length === 0 ? (
          <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">{u.seller.holiday ? "On holiday. Back soon." : "Nothing for sale right now."}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
            {listings.map((l) =>
              bundle ? (
                <button
                  key={l.id}
                  onClick={() => setBundle(bundle.includes(l.id) ? bundle.filter((x) => x !== l.id) : [...bundle, l.id])}
                  className={clsx("relative rounded-xl text-left", bundle.includes(l.id) && "ring-2 ring-accent")}
                >
                  <ShirtTile listing={l} />
                  {bundle.includes(l.id) && (
                    <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-accent text-on-accent">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  <p className="mt-1 text-[13px] font-medium">
                    {l.type} {l.season} · {l.size}
                  </p>
                  <p className="text-sm font-bold">{formatGBP(allInPrice(l.price))}</p>
                </button>
              ) : (
                <ListingCard key={l.id} listing={l} to={routes.listing(l.id, l.clubId)} showClub />
              ),
            )}
          </div>
        )}
        {bundle && bundle.length > 0 && (
          <div className="sticky bottom-2 mt-4 flex items-center gap-3 rounded-2xl bg-ink p-3 text-white shadow-xl">
            <div className="flex-1 text-sm">
              <p className="font-semibold">
                {bundle.length} shirt{bundle.length > 1 ? "s" : ""} · {formatGBP(Math.round(total * (1 - discount / 100)))}
              </p>
              {discount > 0 && <p className="text-xs text-white/70">{discount}% bundle discount applied</p>}
            </div>
            <Link to={routes.checkout(bundle)}>
              <Button className="bg-white text-ink">Buy {bundle.length > 1 ? "bundle" : "it"}</Button>
            </Link>
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Reviews</SectionTitle>
        {reviews.length === 0 ? (
          <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">No reviews yet.</p>
        ) : (
          <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
            {reviews.map((rv) => (
              <div key={rv.id} className="space-y-1 px-4 py-3 text-sm">
                <p className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={clsx("h-3.5 w-3.5", i < rv.stars ? "fill-amber-400 text-amber-400" : "text-neutral-200")} />
                  ))}
                  <span className="ml-1 text-xs text-neutral-500">
                    {s.users[rv.from].name.split(" ")[0]} · {formatDate(rv.at)}
                  </span>
                </p>
                {rv.text && <p className="text-neutral-700">{rv.text}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
