import { ChevronRight, Package, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { ShirtTile } from "../components/ListingCard";
import { Crest, SectionTitle } from "../components/ui";
import { getClub } from "../data/clubs";
import { formatDate, sendBy, shirtTitle } from "../lib/format";
import { formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";
import type { Order } from "../lib/types";

export function WalletPage() {
  const s = useLocker();
  const sales = s.orders.filter((o) => o.sellerId === s.meId);
  const ready = sales.filter((o) => o.status === "completed" && !o.payout);
  const toSend = sales.filter((o) => o.status === "paid");
  const moving = sales.filter((o) => o.status === "dispatched" || o.status === "in_transit" || o.status === "delivered");
  const pending = [...toSend, ...moving].reduce((sum, o) => sum + o.itemPrice, 0);
  const paidOut = sales.filter((o) => o.payout);
  const credits = s.credits.filter((c) => sales.some((o) => o.id === c.orderId));

  return (
    <div className="space-y-6 px-4 pb-6 pt-1">
      <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-locker p-4 text-white">
          <p className="text-xs text-white/80">Locker balance</p>
          <p className="text-2xl font-bold">{formatGBP(s.balances[s.meId] ?? 0)}</p>
        </div>
        <div className="rounded-2xl bg-neutral-100 p-4">
          <p className="text-xs text-neutral-500">Held until delivery</p>
          <p className="text-2xl font-bold">{formatGBP(pending)}</p>
        </div>
      </div>

      {ready.length > 0 && (
        <section>
          <SectionTitle>Ready to pay out</SectionTitle>
          <div className="space-y-2">
            {ready.map((o) => (
              <OrderRow key={o.id} order={o} to={`/app/payout/${o.id}`} note="Sold! Choose how you're paid" highlight />
            ))}
          </div>
        </section>
      )}

      {toSend.length > 0 && (
        <section>
          <SectionTitle>To send</SectionTitle>
          <div className="space-y-2">
            {toSend.map((o) => (
              <OrderRow key={o.id} order={o} to={`/app/orders/${o.id}`} note={`Sold! Send by ${sendBy(o.createdAt)}`} icon={<Package className="h-4 w-4" />} />
            ))}
          </div>
        </section>
      )}

      {moving.length > 0 && (
        <section>
          <SectionTitle>On the way</SectionTitle>
          <div className="space-y-2">
            {moving.map((o) => (
              <OrderRow key={o.id} order={o} to={`/app/orders/${o.id}`} note={o.status === "dispatched" ? "Dropped off" : o.status === "in_transit" ? "In transit" : "Delivered, buyer has 48 hours to check it"} icon={<Truck className="h-4 w-4" />} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>Club credit</SectionTitle>
        {credits.length === 0 ? (
          <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">
            Sell a partner club's shirt and take 110% as club credit. Your codes show up here.
          </p>
        ) : (
          <div className="space-y-2">
            {credits.map((c) => {
              const club = getClub(c.clubId)!;
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl p-3 text-white" style={{ background: club.primary }}>
                  <Crest club={club} className="h-8 w-8" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{formatGBP(c.amount)} to spend</p>
                    <p className="font-mono text-xs opacity-80">{c.code}</p>
                  </div>
                  <span className="text-[11px] opacity-80">{club.shopDomain}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {paidOut.length > 0 && (
        <section>
          <SectionTitle>Paid out</SectionTitle>
          <div className="space-y-2">
            {paidOut.map((o) => (
              <OrderRow key={o.id} order={o} to={`/app/orders/${o.id}`} note={`${formatGBP(o.payout!.amount)} on ${formatDate(o.payout!.at)}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OrderRow({ order, to, note, icon, highlight }: { order: Order; to: string; note: string; icon?: React.ReactNode; highlight?: boolean }) {
  const s = useLocker();
  const listing = s.listings.find((l) => l.id === order.listingId)!;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-2xl border p-2.5 ${highlight ? "border-locker bg-locker-soft" : "border-neutral-200"}`}
    >
      <ShirtTile listing={listing} compact className="w-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {shirtTitle(listing)} · {formatGBP(order.itemPrice)}
        </p>
        <p className={`flex items-center gap-1 text-xs ${highlight ? "font-semibold text-locker" : "text-neutral-500"}`}>
          {icon}
          {note}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-neutral-400" />
    </Link>
  );
}
