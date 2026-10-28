import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { shirtTitle } from "../lib/format";
import { formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";
import type { WalletEntry } from "../lib/types";
import { formatDay } from "../lib/wallet";
import { ShirtTile } from "./ListingCard";

/** One sale's money in the wallet: what's left, when it arrived, and when it moves to the bank automatically. */
export function WalletEntryRow({ entry, to }: { entry: WalletEntry; to: string }) {
  const s = useLocker();
  const order = s.orders.find((o) => o.id === entry.orderId)!;
  const listing = s.listings.find((l) => l.id === order.listingId)!;
  const fresh = !entry.reviewed;

  return (
    <Link to={to} className={clsx("flex items-center gap-3 rounded-2xl border p-2.5", fresh ? "border-accent bg-accent/5" : "border-neutral-200")}>
      <ShirtTile listing={listing} compact className="w-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {fresh ? `Sold! ${formatGBP(entry.amount)} is in your wallet` : `${formatGBP(entry.remaining)} from ${shirtTitle(listing)}`}
        </p>
        <p className={clsx("text-xs", fresh ? "font-semibold text-accent" : "text-neutral-500")}>
          {fresh ? "Keep it, or swap it for club credit or cash" : `Arrived ${formatDay(entry.receivedAt)} · to your bank on ${formatDay(entry.autoTransferAt)}`}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
    </Link>
  );
}
