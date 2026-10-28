import clsx from "clsx";
import { Clock, Copy, Landmark, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getClub } from "../data/clubs";
import { choosePayout } from "../lib/actions";
import { payoutOptions } from "../lib/payouts";
import { formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";
import type { Order, PayoutMethod } from "../lib/types";
import { AUTO_TRANSFER_DAYS, formatDay } from "../lib/wallet";
import { Button, Crest, TickCircle } from "./ui";

/**
 * When a sale completes, the money lands in the seller's wallet by default. This is where they decide whether to
 * keep it there, swap it for 110% club credit (partner clubs' shirts only) or withdraw it to the bank.
 */
export function PayoutChooser({ order, doneHref, doneLabel }: { order: Order; doneHref: string; doneLabel: string }) {
  const s = useLocker();
  const [kept, setKept] = useState(false);
  const [method, setMethod] = useState<PayoutMethod>("locker_balance");
  const listing = s.listings.find((l) => l.id === order.listingId)!;
  const entry = s.wallet.find((e) => e.orderId === order.id);
  const shirtClub = getClub(listing.clubId)!;

  if (!entry)
    return <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">The money arrives in your wallet once the order completes.</p>;

  const autoNote = (
    <p className="flex gap-2 rounded-2xl bg-neutral-50 p-3 text-xs text-neutral-600">
      <Clock className="h-4 w-4 shrink-0" />
      Whatever you leave in your wallet moves to your bank automatically on {formatDay(entry.autoTransferAt)}, {AUTO_TRANSFER_DAYS} days after it
      arrived.
    </p>
  );

  // ---- Done: moved out, or kept in the wallet ----
  if (entry.movedTo || kept) {
    const p = order.payout;
    const club = getClub(p?.clubId);
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <TickCircle size="lg" tone="accent" />
          <h1 className="text-2xl font-bold">
            {entry.movedTo === "club_credit" ? `${formatGBP(p!.amount)} club credit is yours` : entry.movedTo === "bank" ? `${formatGBP(p!.amount)} is on its way` : `${formatGBP(entry.remaining)} stays in your wallet`}
          </h1>
        </div>
        {entry.movedTo === "club_credit" && club && (
          <div className="space-y-3 rounded-2xl p-5" style={{ background: club.primary, color: club.onPrimary }}>
            <div className="flex items-center justify-between">
              <Crest club={club} className="h-9 w-9" />
              <span className="text-xs font-semibold opacity-80">Gift card</span>
            </div>
            <p className="text-3xl font-bold">{formatGBP(p!.amount)}</p>
            <div className="flex items-center justify-between rounded-xl bg-white/15 px-3 py-2 font-mono text-sm">
              {p!.code}
              <Copy className="h-4 w-4" />
            </div>
            <p className="text-xs opacity-80">Spend it at {club.shopDomain}. We've emailed it to you too.</p>
          </div>
        )}
        {entry.movedTo === "bank" && (
          <p className="rounded-2xl bg-neutral-50 p-4 text-center text-sm">Paid to your bank account ending 4417. It usually arrives in 1–2 working days.</p>
        )}
        {!entry.movedTo && (
          <>
            <p className="rounded-2xl bg-accent/5 p-4 text-center text-sm">Spend it on your next shirt, or move it out of your wallet any time.</p>
            {autoNote}
          </>
        )}
        <Link to={doneHref} className="block">
          <Button block>{doneLabel}</Button>
        </Link>
      </div>
    );
  }

  // ---- Choice ----
  const options = payoutOptions(entry.remaining, entry.creditClubId ?? listing.clubId);
  const partlySpent = entry.remaining < entry.amount;

  return (
    <div className="space-y-5">
      <span className="inline-block rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">Completed · the buyer has it</span>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {partlySpent ? `${formatGBP(entry.remaining)} left from this sale` : `Sold! ${formatGBP(entry.amount)} is in your wallet`}
        </h1>
        <p className="text-sm text-neutral-500">It's yours to spend in The Locker. Or move it:</p>
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
                {o.club ? "Swap for club credit" : o.method === "locker_balance" ? "Keep in my wallet" : "Withdraw to my bank"}
                {o.club && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-on-accent">Best value</span>}
              </span>
              <span className="text-xs text-neutral-500">
                {o.club ? `110% in the ${o.club.name} shop` : o.method === "locker_balance" ? "Spend it on your next shirt" : "5% + 50p fee, 1–2 working days"}
              </span>
            </span>
            <span className="text-base font-bold">{formatGBP(o.amount)}</span>
          </button>
        ))}
      </div>
      {!shirtClub.partner && <p className="text-xs text-neutral-500">{shirtClub.name} isn't a Locker partner, so there's no club credit for this shirt.</p>}
      {autoNote}
      <Button
        block
        onClick={() => {
          choosePayout(order.id, method);
          if (method === "locker_balance") setKept(true);
        }}
      >
        {method === "locker_balance" ? "Keep it in my wallet" : "Confirm"}
      </Button>
      <p className="text-center text-xs text-neutral-500">Your money is held safely by our payment partner.</p>
    </div>
  );
}
