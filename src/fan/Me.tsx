import { BadgeCheck, Bell, ChevronRight, HelpCircle, Landmark, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { ShirtTile } from "../components/ListingCard";
import { Crest, SectionTitle } from "../components/ui";
import { getClub } from "../data/clubs";
import { shirtTitle } from "../lib/format";
import { allInPrice, formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";

export function Me() {
  const s = useLocker();
  const me = s.users[s.meId];
  const club = getClub(me.clubId)!;
  const mine = s.listings.filter((l) => l.sellerId === s.meId);
  const bought = s.orders.filter((o) => o.buyerId === s.meId);

  return (
    <div className="space-y-6 px-4 pb-6 pt-1">
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-locker text-lg font-bold text-white">
          {me.name.split(" ").map((p) => p[0]).join("")}
        </span>
        <div>
          <h1 className="text-lg font-bold">{me.name}</h1>
          <p className="flex items-center gap-1 text-sm text-neutral-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {me.rating.toFixed(1)} · {me.sales} sales · {me.city}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3">
        <Crest club={club} className="h-8 w-8" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">{club.name}</p>
          <p className="text-xs text-neutral-500">Your club. Credit payouts go to its shop.</p>
        </div>
      </div>

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
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${l.status === "live" ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-600"}`}
              >
                {l.status === "live" ? "Live" : "Sold"}
              </span>
            </Link>
          ))}
        </div>
      </section>

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

      <section className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
        <SettingRow icon={<BadgeCheck className="h-4 w-4" />} label="Identity" value="Verified by Stripe" />
        <SettingRow icon={<Landmark className="h-4 w-4" />} label="Payout bank" value="•••• 4417" />
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
