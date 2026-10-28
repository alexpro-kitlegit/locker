import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { ListingCard } from "../components/ListingCard";
import { Crest, SectionTitle } from "../components/ui";
import { getClub, PARTNER_CLUBS } from "../data/clubs";
import { DraftRow, hasContent } from "./Sell";
import { firstName } from "../lib/format";
import { useLocker } from "../lib/store";
import { isVisible } from "../lib/reputation";

export function Home() {
  const s = useLocker();
  const me = s.users[s.meId];
  const myClub = getClub(me.clubId)!;
  const live = s.listings.filter((l) => isVisible(s, l) && l.sellerId !== s.meId);
  const fromMyClub = live.filter((l) => l.clubId === myClub.id);
  const drafts = s.drafts.filter((d) => d.ownerId === s.meId && hasContent(d));
  const newest = [...live].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <div className="space-y-6 px-4 pb-6 pt-1">
      <div>
        <p className="text-sm text-neutral-500">Hi {firstName(me.name)}</p>
        <h1 className="text-2xl font-bold tracking-tight">Pre-loved shirts, checked as real.</h1>
      </div>

      {drafts.length > 0 && (
        <section>
          <SectionTitle>Finish your listing</SectionTitle>
          <div className="space-y-2">
            {drafts.map((d) => (
              <DraftRow key={d.id} draft={d} to={`/app/sell/${d.id}`} />
            ))}
          </div>
        </section>
      )}

      <Link to="/app/sell" className="flex items-center gap-3 rounded-2xl bg-locker p-4 text-white">
        <ShieldCheck className="h-8 w-8 shrink-0" strokeWidth={1.6} />
        <div className="flex-1">
          <p className="font-semibold">Sell a shirt for free</p>
          <p className="text-xs text-white/80">Get 110% back as club credit on partner clubs' shirts.</p>
        </div>
        <ArrowRight className="h-5 w-5" />
      </Link>

      <section>
        <SectionTitle
          action={
            <Link to="/app/search" className="text-xs font-semibold text-locker">
              See all
            </Link>
          }
        >
          <span className="flex items-center gap-2">
            <Crest club={myClub} className="h-5 w-5" /> From {myClub.name}
          </span>
        </SectionTitle>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
          {fromMyClub.map((l) => (
            <div key={l.id} className="w-36 shrink-0">
              <ListingCard listing={l} to={`/app/listing/${l.id}`} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Club stores</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {PARTNER_CLUBS.map((c) => (
            <Link
              key={c.id}
              to={`/app/search?club=${c.id}`}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-100 p-3 text-center"
            >
              <Crest club={c} className="h-8 w-8" />
              <span className="text-[11px] font-medium leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>New in</SectionTitle>
        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          {newest.map((l) => (
            <ListingCard key={l.id} listing={l} to={`/app/listing/${l.id}`} showClub />
          ))}
        </div>
      </section>
    </div>
  );
}
