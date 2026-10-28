import clsx from "clsx";
import { Clock, Copy, Landmark } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getClub } from "../data/clubs";
import { moveMoney } from "../lib/actions";
import { formatGBP, payoutAmount } from "../lib/pricing";
import { useLocker } from "../lib/store";
import type { WalletMove } from "../lib/types";
import { AUTO_TRANSFER_DAYS, creditCaps, formatDay, walletBalance, walletEntries } from "../lib/wallet";
import { Button, Crest, TickCircle } from "./ui";

type Dest = { to: "bank" } | { to: "club_credit"; clubId: string };

/**
 * Move money out of the pooled wallet. Pick an amount and where it goes. Do it again to split the rest:
 * some to club credit (110%, capped at what that club's shirts earned), some to the bank, the rest stays.
 */
export function MoveMoney({ userId, doneHref, doneLabel }: { userId: string; doneHref: string; doneLabel: string }) {
  const s = useLocker();
  const balance = walletBalance(s, userId);
  const caps = creditCaps(s, userId);
  const [dest, setDest] = useState<Dest>(caps[0] ? { to: "club_credit", clubId: caps[0].clubId } : { to: "bank" });
  const max = dest.to === "club_credit" ? (caps.find((c) => c.clubId === dest.clubId)?.cap ?? 0) : balance;
  const [text, setText] = useState(((caps[0]?.cap ?? balance) / 100).toFixed(2));
  const [done, setDone] = useState<WalletMove[]>([]);
  const amount = Math.min(Math.round(parseFloat(text || "0") * 100), max);
  const after = balance - amount;
  const nextAuto = walletEntries(s, userId)
    .filter((e) => e.remaining > 0)
    .sort((a, b) => a.autoTransferAt.localeCompare(b.autoTransferAt))[0];

  const pick = (d: Dest) => {
    setDest(d);
    const cap = d.to === "club_credit" ? caps.find((c) => c.clubId === d.clubId)!.cap : balance;
    setText((cap / 100).toFixed(2));
  };

  const confirm = () => {
    const move = moveMoney(userId, amount, dest.to, dest.to === "club_credit" ? dest.clubId : undefined);
    setDone([move, ...done]);
    // Point the form at what's left, ready for the next part of a split.
    setDest({ to: "bank" });
    setText(((balance - amount) / 100).toFixed(2));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Move money</h1>
        <p className="text-sm text-neutral-500">
          {formatGBP(balance)} in your wallet. Move all of it or some of it, and do it again to split the rest.
        </p>
      </div>

      {done.length > 0 && (
        <div className="space-y-2">
          {done.map((m) => (
            <MoveDone key={m.id} move={m} />
          ))}
        </div>
      )}

      {balance > 0 ? (
        <>
          <div className="space-y-2">
            {caps.map((c) => {
              const club = getClub(c.clubId)!;
              const on = dest.to === "club_credit" && dest.clubId === c.clubId;
              return (
                <button
                  key={c.clubId}
                  onClick={() => pick({ to: "club_credit", clubId: c.clubId })}
                  className={clsx("flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left", on ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-neutral-200")}
                >
                  <Crest club={club} className="h-8 w-8" />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {club.name} credit
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-on-accent">110%</span>
                    </span>
                    <span className="text-xs text-neutral-500">
                      Up to {formatGBP(c.cap)}, from your {club.name} shirts
                    </span>
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => pick({ to: "bank" })}
              className={clsx("flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left", dest.to === "bank" ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-neutral-200")}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100">
                <Landmark className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="text-sm font-semibold">Withdraw to my bank</span>
                <span className="block text-xs text-neutral-500">Any amount · 5% + 50p fee · 1–2 working days</span>
              </span>
            </button>
          </div>

          <div>
            <div className="flex items-baseline gap-1 border-b-2 border-ink pb-1">
              <span className="text-3xl font-bold">£</span>
              <input
                inputMode="decimal"
                value={text}
                onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-full bg-transparent text-3xl font-bold outline-none"
              />
              <button onClick={() => setText((max / 100).toFixed(2))} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">
                Max {formatGBP(max)}
              </button>
            </div>
            {Math.round(parseFloat(text || "0") * 100) > max && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {dest.to === "club_credit" ? `You can move up to ${formatGBP(max)} to this club's credit.` : `You have ${formatGBP(max)} in your wallet.`}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4 text-sm">
            <p className="flex justify-between">
              <span>You get</span>
              <span className="font-bold">
                {formatGBP(amount > 0 ? payoutAmount(amount, dest.to) : 0)}
                {dest.to === "club_credit" ? ` ${getClub(dest.clubId)!.name} credit` : " in your bank"}
              </span>
            </p>
            <p className="mt-1 flex justify-between text-neutral-500">
              <span>Left in your wallet</span>
              <span>{formatGBP(after)}</span>
            </p>
          </div>

          <Button block disabled={amount <= 0} onClick={confirm}>
            Move {formatGBP(Math.max(amount, 0))}
          </Button>
        </>
      ) : (
        <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">Your wallet is empty. Money from your next sale lands here.</p>
      )}

      {nextAuto && (
        <p className="flex gap-2 rounded-2xl bg-neutral-50 p-3 text-xs text-neutral-600">
          <Clock className="h-4 w-4 shrink-0" />
          Whatever stays in your wallet moves to your bank automatically {AUTO_TRANSFER_DAYS} days after it arrived. Next: {formatGBP(nextAuto.remaining)}{" "}
          on {formatDay(nextAuto.autoTransferAt)}.
        </p>
      )}

      <Link to={doneHref} className="block">
        <Button block variant="secondary">
          {doneLabel}
        </Button>
      </Link>
    </div>
  );
}

function MoveDone({ move }: { move: WalletMove }) {
  const club = getClub(move.clubId);
  return club ? (
    <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: club.primary, color: club.onPrimary }}>
      <Crest club={club} className="h-8 w-8" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">{formatGBP(move.received)} {club.name} credit</p>
        <p className="flex items-center gap-1 font-mono text-xs opacity-80">
          {move.code} <Copy className="h-3 w-3" />
        </p>
      </div>
      <span className="text-[11px] opacity-80">from {formatGBP(move.amount)}</span>
    </div>
  ) : (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3 text-sm">
      <TickCircle tone="accent" />
      <p className="flex-1">
        <span className="font-semibold">{formatGBP(move.received)}</span> on its way to your bank (from {formatGBP(move.amount)})
      </p>
    </div>
  );
}
