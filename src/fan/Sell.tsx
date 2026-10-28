import { ChevronRight, Plus } from "lucide-react";
import { useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ShirtArt } from "../components/ShirtArt";
import { SellFlow } from "../components/sell/SellFlow";
import { Button, SectionTitle } from "../components/ui";
import { getClub } from "../data/clubs";
import { mandatorySlots } from "../data/slots";
import { createDraft, setAppUser } from "../lib/actions";
import { formatDate, shirtTitle } from "../lib/format";
import { getState, useLocker } from "../lib/store";
import type { Draft } from "../lib/types";

/** Sell tab: carry on a draft (maybe started on a club's website), or start a new listing. */
export function Sell() {
  const s = useLocker();
  const navigate = useNavigate();
  const { key } = useLocation();
  const drafts = s.drafts.filter((d) => d.ownerId === s.meId && Object.keys(d.slots).length > 0);

  const start = () => {
    // Read fresh state: StrictMode runs the auto-start effect twice, and we want one draft.
    const st = getState();
    const empty = st.drafts.find((d) => d.ownerId === st.meId && Object.keys(d.slots).length === 0);
    const id = empty?.id ?? createDraft(st.meId, { surface: "app" });
    navigate(`/app/sell/${id}`);
  };

  if (drafts.length === 0) return <StartNew key={key} start={start} />;

  return (
    <div className="space-y-5 px-4 pb-6 pt-1">
      <h1 className="text-2xl font-bold tracking-tight">Sell a shirt</h1>
      <section>
        <SectionTitle>Carry on where you left off</SectionTitle>
        <div className="space-y-2">
          {drafts.map((d) => (
            <DraftRow key={d.id} draft={d} to={`/app/sell/${d.id}`} />
          ))}
        </div>
      </section>
      <Button block variant="secondary" onClick={start}>
        <Plus className="h-4 w-4" /> Start a new listing
      </Button>
    </div>
  );
}

function StartNew({ start }: { start: () => void }) {
  useEffect(start, []);
  return null;
}

export function SellDraft() {
  const { draftId } = useParams();
  const s = useLocker();
  const navigate = useNavigate();
  const draft = s.drafts.find((d) => d.id === draftId);

  // Prototype: a hand-off link from a club store signs the app in as the same Locker account.
  useEffect(() => {
    if (draft) setAppUser(draft.ownerId);
  }, [draft?.ownerId]);

  if (!draftId) return <Navigate to="/app/sell" replace />;

  return (
    <SellFlow
      key={draftId}
      draftId={draftId}
      surface="app"
      listingHref={(id) => `/app/listing/${id}`}
      accountHref="/app/me"
      onSellAnother={() => navigate("/app/sell")}
    />
  );
}

export function DraftRow({ draft, to }: { draft: Draft; to: string }) {
  const club = getClub(draft.shirt?.clubId);
  const required = club && draft.shirt ? mandatorySlots(club, draft.shirt.season) : ["front", "back", "wash-label"];
  const done = required.filter((r) => draft.slots[r as keyof Draft["slots"]]).length;
  const startedIn = draft.startedOn.surface === "store" ? `the ${getClub(draft.startedOn.clubId)?.name} store` : "The Locker app";

  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-3">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-tile">
        {draft.slots.front?.thumb ? (
          <img src={draft.slots.front.thumb} alt="" className="h-full w-full rounded-xl object-cover" />
        ) : club && draft.shirt ? (
          <ShirtArt kit={club.kits[draft.shirt.type]} className="h-10 w-10" />
        ) : null}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate font-semibold">{club && draft.shirt ? `${club.name} ${shirtTitle(draft.shirt)}` : "New listing"}</p>
        <p className="text-xs text-neutral-500">
          {done} of {required.length} required photos · started in {startedIn} · {formatDate(draft.updatedAt)}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-neutral-400" />
    </Link>
  );
}
