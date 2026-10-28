import clsx from "clsx";
import { Copy, Landmark, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackHeader, Button, Crest, TickCircle } from "../components/ui";
import { getClub } from "../data/clubs";
import { choosePayout } from "../lib/actions";
import { formatGBP, payoutAmount } from "../lib/pricing";
import { useLocker } from "../lib/store";
import type { PayoutMethod } from "../lib/types";

/** The "Sold! £x is yours" screen from the founders' deck. */
export function Payout() {
  const { id } = useParams();
  const s = useLocker();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PayoutMethod>("club_credit");
  const order = s.orders.find((o) => o.id === id);
  if (!order) return <BackHeader title="Order not found" />;

  const club = getClub(s.users[order.sellerId].clubId)!;
  const price = order.itemPrice;

  if (order.payout) {
    const p = order.payout;
    return (
      <div className="space-y-5 px-5 pb-6 pt-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <TickCircle size="lg" tone="locker" />
          <h1 className="text-2xl font-bold">{formatGBP(p.amount)} is on its way</h1>
        </div>
        {p.method === "club_credit" && (
          <div className="space-y-3 rounded-2xl p-5 text-white" style={{ background: club.primary }}>
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
          <p className="rounded-2xl bg-locker-soft p-4 text-center text-sm">
            Added to your Locker balance. Use it on your next shirt.
          </p>
        )}
        {p.method === "bank" && (
          <p className="rounded-2xl bg-neutral-50 p-4 text-center text-sm">
            Paid to your bank account ending 4417. It usually arrives in 1–2 working days.
          </p>
        )}
        <Button block onClick={() => navigate("/app/wallet")}>
          Go to wallet
        </Button>
      </div>
    );
  }

  const options: { id: PayoutMethod; label: string; detail: string; icon: React.ReactNode; best?: boolean }[] = [
    { id: "club_credit", label: "Club credit", detail: `110% in the ${club.name} shop`, icon: <Crest club={club} className="h-6 w-6" />, best: true },
    { id: "locker_balance", label: "Spend in The Locker", detail: "Use it on your next shirt", icon: <Wallet className="h-5 w-5 text-locker" /> },
    { id: "bank", label: "Cash to your bank", detail: "5% + 50p fee", icon: <Landmark className="h-5 w-5 text-neutral-600" /> },
  ];

  return (
    <div className="space-y-5 px-4 pb-6 pt-3">
      <span className="inline-block rounded-full bg-locker-soft px-2.5 py-1 text-[11px] font-semibold text-locker">
        Delivered · buyer has the certificate
      </span>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sold! {formatGBP(price)} is yours</h1>
        <p className="text-sm text-neutral-500">How would you like it?</p>
      </div>
      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => setMethod(o.id)}
            className={clsx(
              "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left",
              method === o.id ? "border-locker bg-locker-soft/60 ring-1 ring-locker" : "border-neutral-200",
            )}
          >
            <span className={clsx("grid h-4 w-4 shrink-0 place-items-center rounded-full border-2", method === o.id ? "border-locker" : "border-neutral-300")}>
              {method === o.id && <span className="h-2 w-2 rounded-full bg-locker" />}
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white">{o.icon}</span>
            <span className="flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold">
                {o.label}
                {o.best && <span className="rounded-full bg-locker px-2 py-0.5 text-[10px] font-bold text-white">Best value</span>}
              </span>
              <span className="text-xs text-neutral-500">{o.detail}</span>
            </span>
            <span className="text-base font-bold">{formatGBP(payoutAmount(price, o.id))}</span>
          </button>
        ))}
      </div>
      <Button block onClick={() => choosePayout(order.id, method)}>
        Confirm
      </Button>
      <p className="text-center text-xs text-neutral-500">Your money is held safely by our payment partner.</p>
    </div>
  );
}
