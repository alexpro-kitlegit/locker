import clsx from "clsx";
import { Search as SearchIcon } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ListingCard } from "../components/ListingCard";
import { CLUBS } from "../data/clubs";
import { isRetro, shirtTitle } from "../lib/format";
import { useLocker } from "../lib/store";
import { isVisible } from "../lib/reputation";
import type { ShirtType } from "../lib/types";

const TYPES: (ShirtType | "Retro")[] = ["Home", "Away", "Third", "Goalkeeper", "Retro"];

export function Search() {
  const s = useLocker();
  const [params, setParams] = useSearchParams();
  const club = params.get("club");
  const [type, setType] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const results = s.listings.filter((l) => {
    if (!isVisible(s, l)) return false;
    if (club && l.clubId !== club) return false;
    if (type === "Retro" ? !isRetro(l.season) : type && l.type !== type) return false;
    if (q) {
      const clubName = CLUBS.find((c) => c.id === l.clubId)!.name;
      if (!`${clubName} ${shirtTitle(l)} ${l.printing ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 px-4 pb-6 pt-1">
      <label className="flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2.5">
        <SearchIcon className="h-4 w-4 text-neutral-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Club, season or player"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </label>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={!club} onClick={() => setParams({})}>
          All clubs
        </Chip>
        {CLUBS.map((c) => (
          <Chip key={c.id} active={club === c.id} onClick={() => setParams({ club: c.id })}>
            {c.name}
          </Chip>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(type === t ? null : t)}>
            {t}
          </Chip>
        ))}
      </div>

      <p className="text-xs text-neutral-500">{results.length} shirts, all checked by KitLegit</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5">
        {results.map((l) => (
          <ListingCard key={l.id} listing={l} to={`/app/listing/${l.id}`} showClub />
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
        active ? "bg-ink text-white" : "bg-neutral-100 text-neutral-700",
      )}
    >
      {children}
    </button>
  );
}
