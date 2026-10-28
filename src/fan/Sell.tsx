import { ChevronRight, Plus } from "lucide-react";
import { useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { SellFlow } from "../components/sell/SellFlow";
import { Button, SectionTitle } from "../components/ui";
import { getClub } from "../data/clubs";
import { blockers } from "../components/sell/flow";
import { PhotoView } from "../components/sell/PhotoGuide";
import { kitFor } from "../components/sell/UploadStep";
import { createDraft, setAppUser } from "../lib/actions";
import { formatDate } from "../lib/format";
import { getState, useLocker } from "../lib/store";
import type { Draft } from "../lib/types";

/** Sell tab: carry on a draft (maybe started on a club's website), or start a new listing. */
export function Sell() {
  const s = useLocker();
  const navigate = useNavigate();
  const { key } = useLocation();
  const drafts = s.drafts.filter((d) => d.ownerId === s.meId && hasContent(d));

  const start = () => {
    // Read fresh state: StrictMode runs the auto-start effect twice, and we want one draft.
    const st = getState();
    const empty = st.drafts.find((d) => d.ownerId === st.meId && !hasContent(d));
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
      exitHref="/app"
      onSellAnother={() => navigate("/app/sell")}
    />
  );
}

/** A draft has something in it once it has photos (still in the upload pool, or sorted into slots). */
export const hasContent = (d: Draft) => d.pool.length > 0 || Object.keys(d.slots).length > 0;

const STEP_LABEL: Record<Draft["step"], string> = {
  upload: "Photos",
  season: "Confirm the season",
  review: "Check photos",
  confirm: "Details",
  price: "Price",
};

export function DraftRow({ draft, to }: { draft: Draft; to: string }) {
  const id = draft.identified;
  const club = getClub(id?.clubId);
  const front = draft.slots.front?.photo ?? draft.pool[0];
  const photos = draft.pool.length + Object.values(draft.slots).filter((x) => x?.photo).length;
  const missing = id ? blockers(draft).filter((b) => b.missingPhoto).length : 0;
  const startedIn = draft.startedOn.surface === "store" ? `the ${getClub(draft.startedOn.clubId)?.name} store` : "The Locker app";

  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-3">
      <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        {front ? <PhotoView photo={front} kit={club?.kits[id!.type] ?? kitFor(draft.demoShirt)} /> : <span className="block h-full bg-tile" />}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate font-semibold">{club && id ? `${club.name} ${id.type}${id.season ? ` ${id.season}` : ""}` : "New listing"}</p>
        <p className="text-xs text-neutral-500">
          {STEP_LABEL[draft.step]} · {missing > 0 ? `${missing} required photo${missing > 1 ? "s" : ""} to go` : `${photos} photos`} · started in {startedIn} ·{" "}
          {formatDate(draft.updatedAt)}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-neutral-400" />
    </Link>
  );
}
