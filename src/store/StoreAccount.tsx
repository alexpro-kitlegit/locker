import clsx from "clsx";
import { ChevronRight, LogOut, Smartphone } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ShirtTile } from "../components/ListingCard";
import { QrCode } from "../components/QrCode";
import { Crest, LockerLogo, SectionTitle } from "../components/ui";
import { ACCOUNT_METHOD_NAMES, getClub } from "../data/clubs";
import { DraftRow, hasContent } from "../fan/Sell";
import { setStoreUser } from "../lib/actions";
import { sendBy, shirtTitle } from "../lib/format";
import { allInPrice, formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";
import { AUTO_TRANSFER_DAYS, unreviewed, walletBalance, walletEntries } from "../lib/wallet";
import { WalletEntryRow } from "../components/WalletEntryRow";
import type { Listing } from "../lib/types";
import { LISTING_STATUS } from "../lib/status";
import { SellerSettings, TaxCard } from "../components/seller";
import { useStore } from "./StoreLayout";

const STATUS = LISTING_STATUS;

/**
 * The fan's Locker account, seen through the club's store. It is the same account as in The Locker
 * app, so it shows everything: listings for any club, sales, wallet and purchases.
 */
export function StoreAccount() {
  const { club, user } = useStore();
  const s = useLocker();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const highlight = params.get("listing");
  if (!user) return <Navigate to={`/store/${club.id}`} replace />;

  const base = `/store/${club.id}`;
  const drafts = s.drafts.filter((d) => d.ownerId === user.id && hasContent(d));
  const listings = s.listings.filter((l) => l.sellerId === user.id && l.status !== "sold");
  const sales = s.orders.filter((o) => o.sellerId === user.id);
  const toSend = sales.filter((o) => o.status === "paid");
  const fresh = unreviewed(s, user.id);
  const balance = walletBalance(s, user.id);
  const held = walletEntries(s, user.id).filter((e) => e.reviewed && e.remaining > 0);
  const purchases = s.orders.filter((o) => o.buyerId === user.id);
  const credits = s.credits.filter((c) => c.userId === user.id);
  const favourite = getClub(user.clubId)!;
  const listingOf = (id: string) => s.listings.find((l) => l.id === id)!;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-lg font-bold text-on-accent">
          {user.name.split(" ").map((p) => p[0]).join("")}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
          <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-neutral-500">
            {club.accountMethod !== "locker" && <>Signed in with your {club.accountName}, linked to your </>}
            <LockerLogo className="text-xs" /> account · favourite club{" "}
            <Crest club={favourite} className="h-3.5 w-3.5" /> {favourite.name}
          </p>
        </div>
        <button
          onClick={() => {
            setStoreUser(null);
            navigate(base);
          }}
          className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      {(fresh.length > 0 || toSend.length > 0) && (
        <section>
          <SectionTitle>Needs you</SectionTitle>
          <div className="space-y-2">
            {fresh.map((e) => (
              <WalletEntryRow key={e.id} entry={e} to={`${base}/payout/${e.orderId}`} />
            ))}
            {toSend.map((o) => (
              <div key={o.id} className="flex items-center gap-4 rounded-2xl border border-neutral-200 p-3">
                <ShirtTile listing={listingOf(o.listingId)} compact className="w-14 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold">Sold! Send {shirtTitle(listingOf(o.listingId))} by {sendBy(o.createdAt)}</p>
                  <p className="flex items-center gap-1 text-xs text-neutral-500">
                    <Smartphone className="h-3.5 w-3.5" /> Your label is ready: scan to get the drop-off QR code on your phone, or print it.
                  </p>
                  <Link to={`/app/orders/${o.id}`} target="_top" className="text-xs font-semibold text-amber-700 underline">
                    Prototype: open on this device
                  </Link>
                </div>
                <QrCode seed={o.id} className="h-16 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}

      {drafts.length > 0 && (
        <section>
          <SectionTitle>Unfinished listings</SectionTitle>
          <div className="space-y-2">
            {drafts.map((d) => (
              <DraftRow key={d.id} draft={d} to={`${base}/sell/${d.id}`} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle
          action={
            <Link to={`${base}/sell`} className="text-sm font-semibold text-accent">
              Sell a shirt
            </Link>
          }
        >
          Your listings
        </SectionTitle>
        {listings.length === 0 ? (
          <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">Nothing listed yet.</p>
        ) : (
          <div className="space-y-2">
            {listings.map((l) => (
              <ListingRow key={l.id} listing={l} highlight={l.id === highlight} storeClubId={club.id} />
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-neutral-500">Includes shirts you listed in The Locker app or another club's Locker.</p>
      </section>

      <section>
        <SectionTitle>Wallet</SectionTitle>
        <div className="mb-3 flex flex-wrap items-center gap-4 rounded-2xl bg-neutral-50 p-4">
          <div className="flex-1">
            <p className="text-xs text-neutral-500">In your wallet</p>
            <p className="text-3xl font-bold">{formatGBP(balance)}</p>
            <p className="mt-1 text-xs text-neutral-500">
              Spend it in The Locker or move it any time. Anything left moves to your bank automatically {AUTO_TRANSFER_DAYS} days after it arrives.
            </p>
          </div>
          {balance > 0 && (
            <Link to={`${base}/wallet/move`} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent">
              Move money
            </Link>
          )}
        </div>
        {held.length > 0 && (
          <div className="mb-3 space-y-2">
            {held.map((e) => (
              <WalletEntryRow key={e.id} entry={e} to={`${base}/payout/${e.orderId}`} />
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {credits.map((c) => {
            const cc = getClub(c.clubId)!;
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: cc.primary, color: cc.onPrimary }}>
                <Crest club={cc} className="h-8 w-8" />
                <div>
                  <p className="font-semibold">{formatGBP(c.amount)} {cc.name} credit</p>
                  <p className="font-mono text-xs opacity-80">{c.code}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {user.seller.status === "verified" && (
        <section className="space-y-3">
          <SectionTitle
            action={
              <Link to={`${base}/seller/${user.id}`} className="text-sm font-semibold text-accent">
                Your public profile
              </Link>
            }
          >
            Selling
          </SectionTitle>
          <SellerSettings userId={user.id} />
          <TaxCard userId={user.id} />
        </section>
      )}

      {purchases.length > 0 && (
        <section>
          <SectionTitle>Bought</SectionTitle>
          <div className="space-y-2">
            {purchases.map((o) => (
              <Link key={o.id} to={o.clubId === club.id ? `${base}/order/${o.id}` : `/app/orders/${o.id}`} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3">
                <ShirtTile listing={listingOf(o.listingId)} compact className="w-14 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold">{shirtTitle(listingOf(o.listingId))}</p>
                  <p className="text-xs capitalize text-neutral-500">{o.status.replace("_", " ")}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-neutral-400">Sign-in set-up for this club: {ACCOUNT_METHOD_NAMES[club.accountMethod!]}.</p>
    </div>
  );
}

function ListingRow({ listing, highlight, storeClubId }: { listing: Listing; highlight: boolean; storeClubId: string }) {
  const lc = getClub(listing.clubId)!;
  const inThisStore = listing.clubId === storeClubId;
  const body = (
    <>
      <ShirtTile listing={listing} compact className="w-14 shrink-0" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate font-semibold">
          {lc.name} {shirtTitle(listing)} · {listing.size}
        </p>
        <p className="text-xs text-neutral-500">
          {formatGBP(allInPrice(listing.price))} to buyers ·{" "}
          {listing.status === "live" ? (lc.partner ? `in The Locker app and the ${lc.name} store` : "in The Locker app") : ""}
          {listing.status === "in_review" && "we'll email you when it's live"}
          {listing.status === "rejected" && "our authentication team couldn't approve it"}
        </p>
      </div>
      <span className={clsx("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS[listing.status].tone)}>
        {STATUS[listing.status].label}
      </span>
    </>
  );
  const cls = clsx("flex items-center gap-3 rounded-2xl border p-3", highlight ? "border-accent ring-1 ring-accent" : "border-neutral-200");
  return inThisStore ? (
    <Link to={`/store/${storeClubId}/item/${listing.id}`} className={cls}>
      {body}
    </Link>
  ) : (
    // Other clubs' shirts aren't in this store: manage them in The Locker app.
    <Link to={`/app/listing/${listing.id}`} target="_top" className={cls}>
      {body}
    </Link>
  );
}
