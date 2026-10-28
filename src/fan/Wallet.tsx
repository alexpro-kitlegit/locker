import { ChevronRight, Clock, Package, Truck } from "lucide-react";
import { WalletEntryRow } from "../components/WalletEntryRow";
import { Link } from "react-router-dom";
import { ShirtTile } from "../components/ListingCard";
import { Crest, SectionTitle } from "../components/ui";
import { getClub } from "../data/clubs";
import { formatDate, sendBy, shirtTitle } from "../lib/format";
import { formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";
import { AUTO_TRANSFER_DAYS, formatDay, walletBalance, walletEntries } from "../lib/wallet";
import type { Order } from "../lib/types";

export function WalletPage() {
  const s = useLocker();
  const sales = s.orders.filter((o) => o.sellerId === s.meId);
  const entries = walletEntries(s, s.meId);
  const fresh = entries.filter((e) => !e.reviewed);
  const held = entries.filter((e) => e.reviewed && e.remaining > 0);
  const nextAuto = [...held, ...fresh].filter((e) => e.remaining > 0).sort((a, b) => a.autoTransferAt.localeCompare(b.autoTransferAt))[0];
  const toSend = sales.filter((o) => o.status === "paid");
  const moving = sales.filter((o) => o.status === "dispatched" || o.status === "in_transit" || o.status === "delivered");
  const pending = [...toSend, ...moving].reduce((sum, o) => sum + o.itemPrice, 0);
  const credits = s.credits.filter((c) => c.userId === s.meId);
  const moves = s.walletMoves.filter((m) => m.userId === s.meId);

  return (
    <div className="space-y-6 px-4 pb-6 pt-1">
      <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>

      <div className="space-y-3 rounded-2xl bg-locker p-5 text-white">
        <div>
          <p className="text-xs text-white/80">In your wallet</p>
          <p className="text-4xl font-bold">{formatGBP(walletBalance(s, s.meId))}</p>
        </div>
        <p className="text-xs text-white/80">
          Spend it in The Locker, or move it whenever you like. Anything left moves to your bank automatically {AUTO_TRANSFER_DAYS} days after
          it arrives.
        </p>
        {nextAuto && (
          <p className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-medium">
            <Clock className="h-3.5 w-3.5" /> Next to your bank: {formatGBP(nextAuto.remaining)} on {formatDay(nextAuto.autoTransferAt)}
          </p>
        )}
        {walletBalance(s, s.meId) > 0 && (
          <Link to="/app/wallet/move" className="block rounded-full bg-white py-2.5 text-center text-sm font-semibold text-locker">
            Move money
          </Link>
        )}
      </div>

      {pending > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-neutral-100 px-4 py-3">
          <p className="text-sm text-neutral-600">Held until delivery</p>
          <p className="font-bold">{formatGBP(pending)}</p>
        </div>
      )}

      {fresh.length > 0 && (
        <section>
          <SectionTitle>Just arrived</SectionTitle>
          <div className="space-y-2">
            {fresh.map((e) => (
              <WalletEntryRow key={e.id} entry={e} to={`/app/payout/${e.orderId}`} />
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

      {held.length > 0 && (
        <section>
          <SectionTitle>In your wallet</SectionTitle>
          <div className="space-y-2">
            {held.map((e) => (
              <WalletEntryRow key={e.id} entry={e} to={`/app/payout/${e.orderId}`} />
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

      {moves.length > 0 && (
        <section>
          <SectionTitle>Moved out of your wallet</SectionTitle>
          <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
            {moves.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  {m.to === "bank" ? "To your bank" : `${getClub(m.clubId)!.name} credit`}
                  <span className="block text-xs text-neutral-500">{formatDate(m.at)}</span>
                </span>
                <span className="text-right">
                  <span className="font-semibold">{formatGBP(m.received)}</span>
                  <span className="block text-xs text-neutral-500">from {formatGBP(m.amount)}</span>
                </span>
              </div>
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
