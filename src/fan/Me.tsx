import { BadgeCheck, Bell, ChevronRight, HelpCircle, Landmark, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { KitLegitConnect } from "../components/KitLegitConnect";
import { ShirtTile } from "../components/ListingCard";
import { SellerSettings, TaxCard } from "../components/seller";
import { Crest, SectionTitle } from "../components/ui";
import { getClub } from "../data/clubs";
import { shirtTitle } from "../lib/format";
import { allInPrice, formatGBP } from "../lib/pricing";
import { completedSales, rating } from "../lib/reputation";
import { LISTING_STATUS } from "../lib/status";
import { useLocker } from "../lib/store";

export function Me() {
  const s = useLocker();
  const me = s.users[s.meId];
  const club = getClub(me.clubId)!;
  const r = rating(s, me.id);
  const mine = s.listings.filter((l) => l.sellerId === s.meId);
  const bought = s.orders.filter((o) => o.buyerId === s.meId);
  const verified = me.seller.status === "verified";

  return (
    <div className="space-y-6 px-4 pb-6 pt-1">
      <Link to={`/app/seller/${me.id}`} className="flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-locker text-lg font-bold text-white">
          {me.name.split(" ").map((p) => p[0]).join("")}
        </span>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{me.name}</h1>
          <p className="flex items-center gap-1 text-sm text-neutral-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {r.count ? r.avg.toFixed(1) : "No reviews"} · {me.sales + completedSales(s, me.id)} sales ·{" "}
            {me.city}
          </p>
          <p className="text-xs font-semibold text-locker">See your public profile</p>
        </div>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
      </Link>

      <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3">
        <Crest club={club} className="h-8 w-8" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">{club.name}</p>
          <p className="text-xs text-neutral-500">Your favourite club. You can sell any club's shirt.</p>
        </div>
      </div>

      {!verified && (
        <Link to="/app/onboarding" className="block rounded-2xl bg-locker-soft p-4 text-sm">
          <p className="font-semibold">Want to sell?</p>
          <p className="text-neutral-600">Set up selling once: address, tax details, and ID and bank with Stripe.</p>
        </Link>
      )}

      {mine.length > 0 && (
        <section>
          <SectionTitle>My listings</SectionTitle>
          <div className="space-y-2">
            {mine.map((l) => (
              <Link key={l.id} to={`/app/listing/${l.id}`} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-2.5">
                <ShirtTile listing={l} compact className="w-14 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold">
                    {shirtTitle(l)} · {l.size}
                  </p>
                  <p className="text-xs text-neutral-500">{formatGBP(allInPrice(l.price))} to buyers</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${LISTING_STATUS[l.status].tone}`}>{LISTING_STATUS[l.status].label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {verified && (
        <section className="space-y-3">
          <SectionTitle>Selling</SectionTitle>
          <SellerSettings userId={me.id} />
          <TaxCard userId={me.id} />
        </section>
      )}

      {bought.length > 0 && (
        <section>
          <SectionTitle>Bought</SectionTitle>
          <div className="space-y-2">
            {bought.map((o) => {
              const l = s.listings.find((x) => x.id === o.listingId)!;
              return (
                <Link key={o.id} to={`/app/orders/${o.id}`} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-2.5">
                  <ShirtTile listing={l} compact className="w-14 shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold">{shirtTitle(l)}</p>
                    <p className="text-xs capitalize text-neutral-500">{o.status.replace("_", " ")}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>Connected apps</SectionTitle>
        <KitLegitConnect userId={me.id} />
      </section>

      <section className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
        <SettingRow icon={<BadgeCheck className="h-4 w-4" />} label="Identity" value={verified ? "Verified by Stripe" : "Not set up"} />
        {verified && <SettingRow icon={<Landmark className="h-4 w-4" />} label="Payout bank" value={`•••• ${me.seller.bankLast4}`} />}
        {me.seller.address && <SettingRow icon={<MapPin className="h-4 w-4" />} label="Address for labels" value={me.seller.address.postcode} />}
        <SettingRow icon={<Bell className="h-4 w-4" />} label="Notifications" value="Push and email" />
        <SettingRow icon={<HelpCircle className="h-4 w-4" />} label="Help" value="Where's my shirt?" />
      </section>
    </div>
  );
}

function SettingRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm">
      <span className="text-neutral-500">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-xs text-neutral-500">{value}</span>
      <ChevronRight className="h-4 w-4 text-neutral-300" />
    </div>
  );
}
