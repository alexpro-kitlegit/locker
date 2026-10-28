import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, Loader2, Nfc, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getClub, PARTNER_CLUBS } from "../../data/clubs";
import { NAMED_SLOTS } from "../../data/slots";
import { valueShirt } from "../../data/valuation";
import { deleteDraft, listingType, setNextVerdict, setUnsureId, submitDraft } from "../../lib/actions";
import { shirtTitle } from "../../lib/format";
import { payoutOptions } from "../../lib/payouts";
import { allInPrice, formatGBP, NFC_THRESHOLD } from "../../lib/pricing";
import { getState, useLocker } from "../../lib/store";
import type { Club, Draft, DraftStep, NamedSlot } from "../../lib/types";
import { Button, Crest, DemoButton, PrototypeControls, TickCircle } from "../ui";
import { ConfirmStep, confirmProblems } from "./ConfirmStep";
import { analyse, mandatoryFor, patchDraft, useWide } from "./flow";
import { Handoff } from "./Handoff";
import { PhotoGuideDrawer } from "./PhotoGuide";
import { ProcessingStep } from "./ProcessingStep";
import { ReviewStep } from "./ReviewStep";
import { SeasonSelectStep } from "./SeasonSelectStep";
import { Sheet, SheetButton } from "./Sheet";
import { Toaster } from "./toast";
import { kitFor, samplePhotos, UploadStep } from "./UploadStep";

type Shirt = NonNullable<Draft["demoShirt"]>;

/** Prototype: KitLegit identifies the shirt from the photos. Here the demo picks which shirt is in them. */
function sampleShirts(context: Club): Shirt[] {
  const otherPartner = PARTNER_CLUBS.find((c) => c.id !== context.id)!;
  return [
    { clubId: context.id, type: "Home", season: "2023/24" },
    { clubId: context.id, type: "Away", season: "1998/99" },
    { clubId: otherPartner.id, type: "Third", season: "2022/23" },
    { clubId: "eastbridge", type: "Home", season: "2005/06" },
  ];
}

// KitLegit's top-bar step circles (upload / review / confirm), plus The Locker's price step.
const BAR_STEPS: DraftStep[] = ["upload", "review", "confirm", "price"];

/**
 * The listing flow, shared by The Locker app and every club store. It reproduces KitLegit's check flow
 * (upload → processing → season select when unsure → review → confirm), then adds The Locker's price step.
 * The check itself runs in the background after submitting: the seller never sees KitLegit, a verdict or a certificate.
 */
export function SellFlow({
  draftId,
  surface,
  storeClub,
  listingHref,
  accountHref,
  exitHref,
  onSellAnother,
}: {
  draftId: string;
  surface: "app" | "store";
  storeClub?: Club;
  listingHref: (listingId: string) => string;
  accountHref: string;
  exitHref: string;
  onSellAnother: () => void;
}) {
  const s = useLocker();
  const navigate = useNavigate();
  const wide = useWide();
  const [submittedId, setSubmittedId] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const [cta, setCta] = useState(0);
  const [confirmTried, setConfirmTried] = useState(false);
  const [guide, setGuide] = useState<{ slot?: NamedSlot } | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const draft = s.drafts.find((d) => d.id === draftId);

  const owner = draft ? s.users[draft.ownerId] : undefined;
  const context = storeClub ?? getClub(draft?.startedOn.clubId) ?? getClub(owner?.clubId);
  const samples = context ? sampleShirts(context) : [];

  useEffect(() => {
    if (draft && !draft.demoShirt && samples[0]) patchDraft(draft.id, () => ({ demoShirt: samples[0] }));
  }, [draft?.id]);

  const wrap = (children: ReactNode, width = "max-w-6xl") => (
    <div className={clsx("mx-auto px-4 pb-8", surface === "store" ? `${width} pt-4 sm:px-6` : "pt-1")}>
      {children}
      <Toaster />
    </div>
  );

  if (submittedId) return wrap(<Submitted listingId={submittedId} listingHref={listingHref} onSellAnother={onSellAnother} />, "max-w-2xl");

  if (!draft)
    return wrap(
      <div className="space-y-3 py-10 text-center">
        <h1 className="text-xl font-bold">This listing has moved on</h1>
        <p className="text-sm text-neutral-500">It was finished or removed on another device.</p>
        <Link to={accountHref} className="inline-block font-semibold text-accent">
          See your listings
        </Link>
      </div>,
    );

  const shirt = draft.demoShirt ?? samples[0];
  const kit = kitFor(draft.identified ? { clubId: draft.identified.clubId, type: draft.identified.type, season: "" } : shirt);
  const handoff = (title: string, text: string) =>
    surface === "store" ? <Handoff draftId={draft.id} title={title} text={text} /> : undefined;

  if (processing)
    return wrap(
      <ProcessingStep
        onDone={() => {
          patchDraft(draft.id, (d) => analyse(d, getState().demo.unsureId));
          setProcessing(false);
        }}
      />,
    );

  if (draft.step === "season")
    return wrap(
      <SeasonSelectStep
        draft={draft}
        onConfirm={(identified) => patchDraft(draft.id, () => ({ identified, step: "review" }))}
        onRestart={() => patchDraft(draft.id, () => ({ pool: [], slots: {}, identified: undefined, securityCode: undefined, step: "upload" }))}
      />,
    );

  // ---- Top bar: KitLegit's step circles, Back and the primary button -------------------------
  // A shirt already checked in the KitLegit app skips photos and the check: just details and price.
  const barSteps: DraftStep[] = draft.fromKitLegit ? ["confirm", "price"] : BAR_STEPS;
  const record = draft.fromKitLegit ? s.kitlegit.find((r) => r.id === draft.fromKitLegit) : undefined;
  const stepIndex = barSteps.indexOf(draft.step);
  const go = (step: DraftStep) => patchDraft(draft.id, () => ({ step }));
  const bar = {
    upload: { label: "Analyse Photos", disabled: draft.pool.length < 3, run: () => setProcessing(true), back: () => setExitOpen(true) },
    review: { label: "Review", disabled: false, run: () => setCta((c) => c + 1), back: () => setExitOpen(true) },
    confirm: {
      label: "Continue",
      disabled: false,
      run: () => {
        setConfirmTried(true);
        if (confirmProblems(draft).length === 0) go("price");
      },
      back: () => (draft.fromKitLegit ? setExitOpen(true) : go("review")),
    },
    price: {
      label: "List it for free",
      disabled: !draft.price,
      run: () => setSubmittedId(submitDraft(draft.id)),
      back: () => go("confirm"),
    },
  }[draft.step as Exclude<DraftStep, "season">];

  const topBar = (
    <div className={clsx("sticky top-0 z-20 -mx-4 mb-5 flex items-center gap-3 border-b border-neutral-100 bg-white/95 px-4 py-2.5 backdrop-blur", surface === "store" && "sm:-mx-6 sm:px-6")}>
      <div className="flex items-center gap-1">
        {barSteps.map((st, i) => (
          <div key={st} className="flex items-center gap-1">
            <span
              className={clsx(
                "grid place-items-center rounded-full text-[11px] font-bold",
                i === stepIndex ? "h-6 w-6 bg-accent text-on-accent" : i < stepIndex ? "h-5 w-5 bg-accent/15 text-accent" : "h-5 w-5 bg-neutral-100 text-neutral-400",
              )}
            >
              {i < stepIndex ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
            </span>
            {i < barSteps.length - 1 && <span className="h-px w-3 bg-neutral-200" />}
          </div>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        {wide ? (
          <button onClick={bar.back} className="rounded-full px-3 py-1.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-100">
            ← Back
          </button>
        ) : (
          <button onClick={bar.back} className="grid h-8 w-8 place-items-center rounded-full border border-neutral-200" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={bar.run}
          disabled={bar.disabled}
          className={clsx(
            "flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold",
            bar.disabled ? "bg-neutral-200 text-neutral-500" : "bg-accent text-on-accent",
          )}
        >
          {bar.label}
          {wide && !bar.disabled && <ArrowRight className="h-4 w-4" />}
        </button>
        <button onClick={() => setExitOpen(true)} className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100" aria-label="Exit">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const demo = (
    <PrototypeControls title="Prototype: which shirt is in the photos?">
      {samples.map((x) => {
        const c = getClub(x.clubId)!;
        const on = x.clubId === shirt.clubId && x.type === shirt.type && x.season === shirt.season;
        return (
          <DemoButton key={`${x.clubId}${x.season}`} onClick={() => patchDraft(draft.id, () => ({ demoShirt: x }))}>
            {on ? "● " : ""}
            {c.initials} {x.type} {x.season}
            {!c.partner && " (not a partner)"}
          </DemoButton>
        );
      })}
      <span className="w-full" />
      <DemoButton onClick={() => patchDraft(draft.id, (d) => ({ pool: [...d.pool, ...samplePhotos(["front", "back", "wash-label"])].slice(0, 12) }))}>
        Add 3 sample photos
      </DemoButton>
      <DemoButton
        onClick={() =>
          patchDraft(draft.id, (d) => ({ pool: [...d.pool, ...samplePhotos(NAMED_SLOTS.map((x) => x.id).filter((x) => x !== "hologram"))].slice(0, 12) }))
        }
      >
        Add a full set
      </DemoButton>
      <DemoButton onClick={() => setUnsureId(!s.demo.unsureId)}>Identification: {s.demo.unsureId ? "unsure → season select" : "confident"}</DemoButton>
      <DemoButton onClick={() => setNextVerdict(s.demo.nextVerdict === "authentic" ? "counterfeit" : "authentic")}>
        Background result: {s.demo.nextVerdict === "authentic" ? "Authentic" : "Counterfeit"}
      </DemoButton>
    </PrototypeControls>
  );

  let body: ReactNode;
  if (draft.step === "upload")
    body = (
      <>
      {draft.relistOf && (
        <p className="mb-4 rounded-2xl bg-accent/5 p-3 text-sm">
          <span className="font-semibold">You bought this shirt on The Locker.</span> Every listing gets its own check, so add photos and we'll check it
          again.
        </p>
      )}
      <UploadStep
        draft={draft}
        kit={kitFor(shirt)}
        wide={wide}
        capture={surface === "app"}
        openGuide={(slot) => setGuide({ slot })}
        demo={demo}
        handoff={handoff("Rather use your phone's camera?", "Scan to take the photos on your phone. Anything you've added here comes with you.")}
      />
      </>
    );
  else if (draft.step === "review")
    body = (
      <ReviewStep
        draft={draft}
        kit={kit}
        wide={wide}
        cta={cta}
        onPassed={() => go("confirm")}
        openGuide={(slot) => setGuide({ slot })}
        handoff={(missing) =>
          handoff(
            `${missing.length} more photo${missing.length > 1 ? "s" : ""} to go`,
            `Finish on your phone: ${missing.join(", ")}. Everything you've done so far is saved.`,
          )
        }
        demo={
          <PrototypeControls title="Prototype">
            <DemoButton
              onClick={() =>
                patchDraft(draft.id, (d) => ({
                  slots: {
                    ...d.slots,
                    ...Object.fromEntries(
                      mandatoryFor(d)
                        .filter((m) => !d.slots[m])
                        .map((m) => [m, { status: "uploaded", photo: samplePhotos([m])[0] }]),
                    ),
                  },
                }))
              }
            >
              Fill missing required photos with samples
            </DemoButton>
          </PrototypeControls>
        }
      />
    );
  else if (draft.step === "confirm")
    body = (
      <>
        {record && (
          <div className="mx-auto mb-4 flex max-w-2xl gap-3 rounded-2xl bg-ink p-4 text-sm text-white">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <p>
              <span className="font-semibold">Checked on KitLegit · {record.certificate}.</span> No new check needed: add the size and a price, and it goes
              live straight away.
            </p>
          </div>
        )}
        <ConfirmStep draft={draft} attempted={confirmTried} />
      </>
    );
  else body = <PriceStep draft={draft} />;

  return wrap(
    <>
      {topBar}
      {body}

      {guide && (
        <PhotoGuideDrawer
          brand={draft.identified?.brand}
          clubId={draft.identified?.clubId ?? shirt.clubId}
          required={draft.identified ? mandatoryFor(draft) : undefined}
          start={guide.slot}
          onClose={() => setGuide(null)}
        />
      )}

      {exitOpen && (
        <Sheet
          title="Save your progress?"
          sub={`Your photos and details will be saved as a draft. You can continue from where you left off ${surface === "store" ? "in your account" : "on the Sell tab"}, or on your phone.`}
          onClose={() => setExitOpen(false)}
        >
          <SheetButton variant="primary" onClick={() => navigate(exitHref)}>
            Save &amp; Exit
          </SheetButton>
          <SheetButton
            onClick={() => {
              deleteDraft(draft.id);
              navigate(exitHref);
            }}
          >
            Exit Without Saving
          </SheetButton>
        </Sheet>
      )}
    </>,
  );
}

/** The Locker's own step: valuation, price, payout options and where it's shown. */
function PriceStep({ draft }: { draft: Draft }) {
  const [text, setText] = useState(draft.price ? (draft.price / 100).toFixed(2) : "");
  const price = Math.round(parseFloat(text || "0") * 100);
  const id = draft.identified!;
  const club = getClub(id.clubId)!;
  const shirt = { clubId: id.clubId, type: listingType(draft), season: id.season ?? "2015/16" };
  const value = valueShirt(shirt, draft.details.condition!, draft.details.size!);
  const options = payoutOptions(price, club.id);

  const setPrice = (t: string) => {
    setText(t);
    patchDraft(draft.id, () => ({ price: Math.round(parseFloat(t || "0") * 100) || undefined }));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-tile p-3">
        <Crest club={club} className="h-10 w-10" />
        <div className="text-sm">
          <p className="font-semibold">
            {club.name} {shirtTitle(shirt)}
          </p>
          <p className="text-xs text-neutral-500">
            {draft.details.size} · {draft.details.condition}
          </p>
        </div>
      </div>
      <h1 className="text-xl font-bold">Set your price</h1>

      <div className="space-y-3 rounded-2xl bg-ink p-4 text-white">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4" /> Estimated value
        </p>
        <p className="text-3xl font-bold">
          {formatGBP(value.low)} – {formatGBP(value.high)}
        </p>
        <p className="text-xs text-white/70">
          Based on {value.basedOn} sales of {club.name} {shirtTitle(shirt)} shirts in {draft.details.condition?.toLowerCase()} condition.
        </p>
        <button onClick={() => setPrice((value.suggested / 100).toFixed(2))} className="rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-ink">
          Use {formatGBP(value.suggested)}
        </button>
      </div>

      <label className="flex items-baseline gap-1 border-b-2 border-ink pb-1">
        <span className="text-3xl font-bold">£</span>
        <input
          inputMode="decimal"
          value={text}
          onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          className="w-full bg-transparent text-3xl font-bold outline-none"
        />
      </label>

      {price > 0 && (
        <>
          <div className="rounded-2xl bg-neutral-50 p-4 text-sm">
            <p className="mb-2 font-semibold">When it sells, you choose</p>
            {options.map((o) => (
              <div key={o.method} className="flex items-center justify-between py-1">
                <span>
                  {o.method === "club_credit" ? `${o.club!.name} credit` : o.method === "locker_balance" ? "Spend in The Locker" : "Cash to your bank"}
                  <span className="ml-1.5 text-xs text-neutral-500">{o.method === "club_credit" ? "110%, best value" : o.method === "bank" ? "5% + 50p fee" : ""}</span>
                </span>
                <span className={clsx("font-semibold", o.method === "club_credit" && "text-accent")}>{formatGBP(o.amount)}</span>
              </div>
            ))}
            {!club.partner && <p className="mt-2 text-xs text-neutral-500">{club.name} isn't a Locker partner yet, so club credit isn't available for this shirt.</p>}
            <p className="mt-2 border-t border-neutral-200 pt-2 text-xs text-neutral-500">
              Buyers pay {formatGBP(allInPrice(price))} including buyer protection, plus postage. They choose the carrier.
            </p>
          </div>

          <div className="space-y-1.5 rounded-2xl border border-neutral-200 p-4 text-sm">
            <p className="font-semibold">Where it's shown</p>
            <p className="flex items-center gap-2">
              <TickCircle size="sm" tone="accent" /> The Locker app
            </p>
            {club.partner && (
              <p className="flex items-center gap-2">
                <TickCircle size="sm" tone="accent" /> {club.name} store
              </p>
            )}
          </div>

          {price >= NFC_THRESHOLD && (
            <div className="flex gap-3 rounded-2xl bg-accent/5 p-4 text-sm">
              <Nfc className="h-5 w-5 shrink-0 text-accent" />
              <p>
                <span className="font-semibold">High-value shirt.</span> We'll post you a free FanNFC tag to fix to it before you send it, so the buyer can tap
                to prove it's the real one.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** After submitting: the KitLegit check runs in the background. The seller only sees "getting it ready". */
function Submitted({ listingId, listingHref, onSellAnother }: { listingId: string; listingHref: (id: string) => string; onSellAnother: () => void }) {
  const s = useLocker();
  const listing = s.listings.find((l) => l.id === listingId);
  if (!listing) return null;
  const club = getClub(listing.clubId)!;
  const owner = s.users[listing.sellerId];

  if (listing.status === "in_review")
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <h1 className="text-2xl font-bold">Getting your listing ready</h1>
        <p className="max-w-sm text-sm text-neutral-500">
          We're checking a few details. It usually takes a few minutes. We'll email {owner.email} when it's live, so you can close this page.
        </p>
      </div>
    );

  if (listing.status === "rejected")
    return (
      <div className="space-y-4 py-8 text-center">
        <h1 className="text-2xl font-bold">We couldn't list this shirt</h1>
        <p className="mx-auto max-w-sm text-sm text-neutral-500">
          Our authentication team found details that don't match an official {club.name} shirt. You haven't been charged anything.
        </p>
        <div className="mx-auto max-w-xs space-y-2">
          <Button block variant="dark">
            Ask for a second look
          </Button>
          <Button block variant="secondary" onClick={onSellAnother}>
            Sell a different shirt
          </Button>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <TickCircle size="lg" tone="accent" />
      <h1 className="text-2xl font-bold">It's live!</h1>
      <p className="text-sm text-neutral-500">
        {club.name} {shirtTitle(listing)} is for sale in The Locker app{club.partner ? ` and the ${club.name} store` : ""}.
      </p>
      <div className="w-full max-w-xs space-y-2 pt-2">
        <Link to={listingHref(listing.id)}>
          <Button block>View my listing</Button>
        </Link>
        <Button block variant="secondary" onClick={onSellAnother}>
          Sell another
        </Button>
      </div>
    </div>
  );
}
