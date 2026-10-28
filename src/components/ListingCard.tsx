import { Link } from "react-router-dom";
import { getClub } from "../data/clubs";
import { shirtTitle } from "../lib/format";
import { allInPrice, formatGBP } from "../lib/pricing";
import type { Listing } from "../lib/types";
import { ShirtArt } from "./ShirtArt";
import { CheckedBadge } from "./ui";

/** `compact` hides the overlay badges, for thumbnails where they'd cover the shirt. */
export function ShirtTile({ listing, compact, className = "" }: { listing: Listing; compact?: boolean; className?: string }) {
  const club = getClub(listing.clubId)!;
  return (
    <div className={`relative grid aspect-square place-items-center rounded-xl bg-tile ${className}`}>
      {listing.photo ? (
        <img src={listing.photo} alt="" className="absolute inset-0 h-full w-full rounded-[inherit] object-cover" />
      ) : (
        <ShirtArt kit={club.kits[listing.type]} printing={listing.printing} className="h-[78%] w-[78%]" />
      )}
      {!compact && listing.status === "sold" && (
        <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase text-white">Sold</span>
      )}
      {!compact && listing.nfcTag && listing.status !== "sold" && (
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-ink shadow-sm">NFC tagged</span>
      )}
    </div>
  );
}

export function ListingCard({ listing, to, showClub }: { listing: Listing; to: string; showClub?: boolean }) {
  const club = getClub(listing.clubId)!;
  return (
    <Link to={to} className="group block">
      <ShirtTile listing={listing} className="transition group-hover:brightness-[0.97]" />
      <div className="mt-2 space-y-0.5">
        {showClub && <p className="truncate text-[11px] text-neutral-500">{club.name}</p>}
        <p className="truncate text-[13px] font-medium">
          {shirtTitle(listing)} · {listing.size}
        </p>
        <p className="text-[15px] font-bold">{formatGBP(allInPrice(listing.price))}</p>
        <CheckedBadge />
      </div>
    </Link>
  );
}
