import clsx from "clsx";
import { ShieldCheck, Truck, Wallet } from "lucide-react";
import { useState } from "react";
import { ListingCard } from "../components/ListingCard";
import { isRetro } from "../lib/format";
import { useLocker } from "../lib/store";
import type { Club, Listing } from "../lib/types";
import { useClub } from "./StoreLayout";

const FILTERS = ["All", "Home", "Away", "Third", "Goalkeeper", "Retro"] as const;
const SIZES = ["S", "M", "L", "XL"] as const;

export function StoreHome() {
  const club = useClub();
  const s = useLocker();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [size, setSize] = useState<string | null>(null);

  const listings = s.listings
    .filter((l) => l.clubId === club.id && (l.status === "live" || l.status === "sold"))
    .filter((l) => (filter === "All" ? true : filter === "Retro" ? isRetro(l.season) : l.type === filter))
    .filter((l) => !size || l.size === size)
    // Live first, newest first. Recently sold shirts stay visible as social proof.
    .sort((a, b) => Number(a.status === "sold") - Number(b.status === "sold") || b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <Hero club={club} count={listings.filter((l) => l.status === "live").length} />
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-neutral-200" />
          {SIZES.map((sz) => (
            <Chip key={sz} active={size === sz} onClick={() => setSize(size === sz ? null : sz)}>
              Size {sz}
            </Chip>
          ))}
        </div>
        <Grid listings={listings} club={club} />
      </div>
    </>
  );
}

function Grid({ listings, club }: { listings: Listing[]; club: Club }) {
  if (listings.length === 0)
    return <p className="rounded-2xl bg-neutral-50 p-8 text-center text-sm text-neutral-500">No shirts match. Try another filter.</p>;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} to={`/store/${club.id}/item/${l.id}`} />
      ))}
    </div>
  );
}

function Hero({ club, count }: { club: Club; count: number }) {
  const promises = [
    { icon: ShieldCheck, text: "Every shirt checked by KitLegit" },
    { icon: Wallet, text: "Money held until it arrives" },
    { icon: Truck, text: "Tracked delivery from £1.99" },
  ];

  if (club.template === "bold")
    return (
      <section className="bg-accent text-on-accent">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
          <p className="text-sm font-semibold text-accent-2">{count} shirts in stock</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Pre-loved {club.name.split(" ").pop()} shirts. <span className="text-accent-2">Every one checked.</span>
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm opacity-90">
            {promises.map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent-2" /> {text}
              </span>
            ))}
          </div>
        </div>
      </section>
    );

  if (club.template === "minimal")
    return (
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <h1 className="max-w-xl text-3xl font-light tracking-tight sm:text-5xl">
          Fans' shirts, <span className="font-bold text-accent">checked and certified.</span>
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
          {count} shirts from {club.name} fans · {promises.map((p) => p.text).join(" · ")}
        </p>
      </section>
    );

  // classic
  return (
    <section className="border-b border-neutral-100 bg-accent/5">
      <div className="mx-auto grid max-w-6xl gap-2 px-4 py-4 text-sm sm:grid-cols-3 sm:px-6">
        {promises.map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-2 font-medium">
            <Icon className="h-4 w-4 text-accent" /> {text}
          </span>
        ))}
      </div>
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
        active ? "bg-accent text-on-accent" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
      )}
    >
      {children}
    </button>
  );
}
