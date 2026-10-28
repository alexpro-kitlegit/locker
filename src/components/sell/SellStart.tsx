import { BadgeCheck, Camera, PauseCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getClub } from "../../data/clubs";
import { DraftRow, hasContent } from "../../fan/Sell";
import { KitLegitConnect } from "../KitLegitConnect";
import { createDraft, liftHold, startFromKitLegit, startRelist } from "../../lib/actions";
import { formatDate, shirtTitle } from "../../lib/format";
import type { SurfaceRoutes } from "../../lib/routes";
import { getState, useLocker } from "../../lib/store";
import type { Draft } from "../../lib/types";
import { ShirtArt } from "../ShirtArt";
import { ShirtTile } from "../ListingCard";
import { Button, Crest, DemoButton, PrototypeControls, SectionTitle } from "../ui";

/**
 * Where selling starts, in the app and in club stores. Sellers who haven't onboarded go through onboarding first;
 * accounts on hold can't list. Otherwise: carry on a draft, check a new shirt, list a shirt already checked in the
 * KitLegit app (no new check), or re-list a shirt bought on The Locker (checked again).
 */
export function SellStart({
  userId,
  routes,
  startedOn,
  draftHref,
}: {
  userId: string;
  routes: SurfaceRoutes;
  startedOn: Draft["startedOn"];
  draftHref: (id: string) => string;
}) {
  const s = useLocker();
  const navigate = useNavigate();
  const user = s.users[userId];
  const drafts = s.drafts.filter((d) => d.ownerId === userId && hasContent(d));
  const connected = !!user.kitlegit?.connectedAt;
  const checks = connected ? s.kitlegit.filter((r) => r.userId === userId && !r.listingId) : [];
  const bought = s.orders.filter(
    (o) => o.buyerId === userId && o.status === "completed" && !s.drafts.some((d) => d.relistOf === o.listingId) && !s.listings.some((l) => l.relistedFrom === o.listingId),
  );

  if (user.seller.status !== "verified")
    return (
      <div className="space-y-4 py-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-accent">
          <BadgeCheck className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Before your first sale</h1>
        <p className="text-sm text-neutral-600">
          We need a few details once: your address for labels, tax details for HMRC, and your ID and bank via Stripe so you can get paid. About 3 minutes.
        </p>
        <Button block onClick={() => navigate(routes.onboarding)}>
          Set up selling
        </Button>
      </div>
    );

  if (user.seller.onHold)
    return (
      <div className="space-y-4 py-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-700">
          <PauseCircle className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Your account is on hold</h1>
        <p className="text-sm text-neutral-600">
          Three shirts in a row didn't pass our checks, so we've paused selling while our team takes a look. We'll be in touch within 2 working days. Your
          wallet and any open orders aren't affected.
        </p>
        <Button block variant="secondary">
          Contact support
        </Button>
        <PrototypeControls title="Prototype: support's decision">
          <DemoButton onClick={() => liftHold(userId)}>Lift the hold</DemoButton>
        </PrototypeControls>
      </div>
    );

  const start = () => {
    const st = getState();
    const empty = st.drafts.find((d) => d.ownerId === userId && !hasContent(d) && !d.fromKitLegit && !d.relistOf && d.startedOn.surface === startedOn.surface);
    navigate(draftHref(empty?.id ?? createDraft(userId, startedOn)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sell a shirt</h1>
        <p className="text-sm text-neutral-500">Free to list. Every shirt is checked before it goes on sale.</p>
      </div>

      {drafts.length > 0 && (
        <section>
          <SectionTitle>Carry on where you left off</SectionTitle>
          <div className="space-y-2">
            {drafts.map((d) => (
              <DraftRow key={d.id} draft={d} to={draftHref(d.id)} />
            ))}
          </div>
        </section>
      )}

      <button onClick={start} className="flex w-full items-center gap-3 rounded-2xl bg-accent p-4 text-left text-on-accent">
        <Camera className="h-7 w-7 shrink-0" strokeWidth={1.6} />
        <span className="flex-1">
          <span className="block font-semibold">Sell a new shirt</span>
          <span className="text-xs opacity-80">Add photos and we'll do the rest.</span>
        </span>
      </button>

      {!connected && <KitLegitConnect userId={userId} compact />}

      {checks.length > 0 && (
        <section>
          <SectionTitle>Already checked on KitLegit</SectionTitle>
          <p className="mb-2 text-xs text-neutral-500">Shirts you checked in the KitLegit app. Authentic ones go live straight away, no new check.</p>
          <div className="space-y-2">
            {checks.map((r) => {
              const club = getClub(r.clubId)!;
              const ok = r.verdict === "authentic";
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-2.5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-tile">
                    <ShirtArt kit={club.kits[r.type]} className="h-9 w-9" />
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="flex items-center gap-1 truncate font-semibold">
                      <Crest club={club} className="h-3.5 w-3.5" /> {club.name} {shirtTitle(r)}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-neutral-500">
                      <ShieldCheck className="h-3.5 w-3.5" /> {ok ? `Authentic · ${r.certificate}` : "Didn't pass. It can't be listed"} · {formatDate(r.checkedAt)}
                    </p>
                  </div>
                  {ok && (
                    <Button className="shrink-0 px-3 py-1.5" onClick={() => navigate(draftHref(startFromKitLegit(userId, r.id, startedOn)))}>
                      List it
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {bought.length > 0 && (
        <section>
          <SectionTitle>Bought here before?</SectionTitle>
          <p className="mb-2 text-xs text-neutral-500">Shirts you bought on The Locker can be sold again. We check them again first.</p>
          <div className="space-y-2">
            {bought.map((o) => {
              const l = s.listings.find((x) => x.id === o.listingId)!;
              return (
                <div key={o.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-2.5">
                  <ShirtTile listing={l} compact className="w-12 shrink-0" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-semibold">
                      {getClub(l.clubId)!.name} {shirtTitle(l)}
                    </p>
                    <p className="text-xs text-neutral-500">Bought {formatDate(o.createdAt)}</p>
                  </div>
                  <Button variant="secondary" className="shrink-0 px-3 py-1.5" onClick={() => navigate(draftHref(startRelist(userId, o.id, startedOn)))}>
                    <RotateCcw className="h-3.5 w-3.5" /> Sell it
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
