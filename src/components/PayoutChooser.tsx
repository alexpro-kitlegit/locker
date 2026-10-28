import clsx from "clsx";
import { Copy, Landmark, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getClub } from "../data/clubs";
import { choosePayout } from "../lib/actions";
import { payoutOptions } from "../lib/payouts";
import { formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";
import type { Order, PayoutMethod } from "../lib/types";
import { Button, Crest, TickCircle } from "./ui";

/** The "Sold! £x is yours" choice. Club credit appears only when the shirt's club is a partner. */
export function PayoutChooser({ order, doneHref, doneLabel }: { order: Order; doneHref: string; doneLabel: string }) {
  const s = useLocker();
  const listing = s.listings.find((l) => l.id === order.listingId)!;
  const options = payoutOptions(order.itemPrice, listing.clubId);
  const [method, setMethod] = useState<PayoutMethod>(options[0].method);
  const shirtClub = getClub(listing.clubId)!;

  if (order.payout) {
    const p = order.payout;
    const club = getClub(p.clubId);
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <TickCircle size="lg" tone="accent" />
          <h1 className="text-2xl font-bold">{formatGBP(p.amount)} is on its way</h1>
        </div>
        {club && (
          <div className="space-y-3 rounded-2xl p-5" style={{ background: club.primary, color: club.onPrimary }}>
            <div className="flex items-center justify-between">
              <Crest club={club} className="h-9 w-9" />
              <span className="text-xs font-semibold opacity-80">Gift card</span>
            </div>
            <p className="text-3xl font-bold">{formatGBP(p.amount)}</p>
            <div className="flex items-center justify-between rounded-xl bg-white/15 px-3 py-2 font-mono text-sm">
              {p.code}
              <Copy className="h-4 w-4" />
            </div>
            <p className="text-xs opacity-80">Spend it at {club.shopDomain}. We've emailed it to you too.</p>
          </div>
        )}
        {p.method === "locker_balance" && (
          <p className="rounded-2xl bg-accent/5 p-4 text-center text-sm">Added to your Locker balance. Use it on your next shirt.</p>
        )}
        {p.method === "bank" && (
          <p className="rounded-2xl bg-neutral-50 p-4 text-center text-sm">
            Paid to your bank account ending 4417. It usually arrives in 1–2 working days.
          </p>
        )}
        <Link to={doneHref} className="block">
          <Button block>{doneLabel}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <span className="inline-block rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
        Delivered · the buyer has it
      </span>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sold! {formatGBP(order.itemPrice)} is yours</h1>
        <p className="text-sm text-neutral-500">How would you like it?</p>
      </div>
      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o.method}
            onClick={() => setMethod(o.method)}
            className={clsx(
              "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left",
              method === o.method ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-neutral-200",
            )}
          >
            <span className={clsx("grid h-4 w-4 shrink-0 place-items-center rounded-full border-2", method === o.method ? "border-accent" : "border-neutral-300")}>
              {method === o.method && <span className="h-2 w-2 rounded-full bg-accent" />}
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white">
              {o.club ? <Crest club={o.club} className="h-6 w-6" /> : o.method === "locker_balance" ? <Wallet className="h-5 w-5 text-accent" /> : <Landmark className="h-5 w-5 text-neutral-600" />}
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold">
                {o.club ? "Club credit" : o.method === "locker_balance" ? "Spend in The Locker" : "Cash to your bank"}
                {o.club && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-on-accent">Best value</span>}
              </span>
              <span className="text-xs text-neutral-500">
                {o.club ? `110% in the ${o.club.name} shop` : o.method === "locker_balance" ? "Use it on your next shirt" : "5% + 50p fee"}
              </span>
            </span>
            <span className="text-base font-bold">{formatGBP(o.amount)}</span>
          </button>
        ))}
      </div>
      {!shirtClub.partner && (
        <p className="text-xs text-neutral-500">
          {shirtClub.name} isn't a Locker partner, so there's no club credit for this shirt.
        </p>
      )}
      <Button block onClick={() => choosePayout(order.id, method)}>
        Confirm
      </Button>
      <p className="text-center text-xs text-neutral-500">Your money is held safely by our payment partner.</p>
    </div>
  );
}
