import clsx from "clsx";
import { ChevronLeft, ImagePlus, Loader2, Nfc, Pencil, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CLUBS, getClub, PARTNER_CLUBS } from "../../data/clubs";
import { MISSING_REASONS, mandatorySlots, SLOT_LABEL, SLOTS } from "../../data/slots";
import { valueShirt } from "../../data/valuation";
import { setNextVerdict, submitDraft, updateDraft } from "../../lib/actions";
import { shirtTitle } from "../../lib/format";
import { fileToThumb } from "../../lib/images";
import { payoutOptions } from "../../lib/payouts";
import { allInPrice, formatGBP, NFC_THRESHOLD } from "../../lib/pricing";
import { useLocker } from "../../lib/store";
import type { Club, Condition, Draft, KitVersion, ShirtType, Size, SlotId, SlotPhoto } from "../../lib/types";
import { Button, Crest, DemoButton, PrototypeControls, TickCircle } from "../ui";
import { Handoff } from "./Handoff";
import { SlotTile } from "./SlotTile";

const STEPS: { id: Draft["step"]; label: string }[] = [
  { id: "photos", label: "Photos" },
  { id: "review", label: "Check photos" },
  { id: "details", label: "Details" },
  { id: "price", label: "Price" },
];

const SEASONS = Array.from({ length: 36 }, (_, i) => {
  const y = 2025 - i;
  return `${y}/${String((y + 1) % 100).padStart(2, "0")}`;
});

type Shirt = NonNullable<Draft["shirt"]>;

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

/**
 * The listing flow, shared by The Locker app and every club store. It follows KitLegit's check flow
 * (photos → sorted into slots → required labels per brand → details), but the check itself runs in the
 * background after the seller submits. The seller never sees "KitLegit is analysing" or a certificate step.
 */
export function SellFlow({
  draftId,
  surface,
  storeClub,
  listingHref,
  accountHref,
  onSellAnother,
  onSaveForLater,
}: {
  draftId: string;
  surface: "app" | "store";
  storeClub?: Club;
  listingHref: (listingId: string) => string;
  accountHref: string;
  onSellAnother: () => void;
  onSaveForLater?: () => void;
}) {
  const s = useLocker();
  const [submittedId, setSubmittedId] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const draft = s.drafts.find((d) => d.id === draftId);
  const wrap = (children: ReactNode) => (
    <div className={surface === "store" ? "mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6" : "space-y-5 px-4 pb-6 pt-1"}>{children}</div>
  );

  useEffect(() => {
    if (!processing) return;
    const t = setTimeout(() => {
      setProcessing(false);
      updateDraft(draftId, { step: "review" });
    }, 1600);
    return () => clearTimeout(t);
  }, [processing, draftId]);

  if (submittedId) return wrap(<Submitted listingId={submittedId} listingHref={listingHref} onSellAnother={onSellAnother} />);

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

  const owner = s.users[draft.ownerId];
  const context = storeClub ?? getClub(draft.startedOn.clubId) ?? getClub(owner.clubId)!;
  const samples = sampleShirts(context);
  const shirt = draft.shirt ?? samples[0];
  const club = getClub(shirt.clubId)!;
  const kit = club.kits[shirt.type];
  const set = (patch: Partial<Draft>) => updateDraft(draft.id, patch);
  const setSlot = (slot: SlotId, photo: SlotPhoto | undefined) => {
    const slots = { ...draft.slots };
    if (photo) slots[slot] = photo;
    else delete slots[slot];
    set({ slots });
  };
  const stepIndex = STEPS.findIndex((x) => x.id === draft.step);
  const back = stepIndex > 0 ? () => set({ step: STEPS[stepIndex - 1].id }) : undefined;

  if (processing)
    return wrap(
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Loader2 className="h-9 w-9 animate-spin text-accent" />
        <p className="font-semibold">Sorting your photos</p>
        <p className="text-sm text-neutral-500">Working out which shirt it is and what else we need.</p>
      </div>,
    );

  const header = (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
        {back && (
          <button onClick={back} className="-ml-1 rounded-full p-1 hover:bg-neutral-100" aria-label="Back">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex].label}
      </div>
      <div className="flex gap-1">
        {STEPS.map((x, i) => (
          <span key={x.id} className={clsx("h-1 flex-1 rounded-full", i <= stepIndex ? "bg-accent" : "bg-neutral-200")} />
        ))}
      </div>
    </div>
  );

  // ---- Photos -------------------------------------------------------------
  if (draft.step === "photos")
    return wrap(
      <>
        {header}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sell your shirt</h1>
          <p className="text-sm text-neutral-500">
            Free to list. Start with the front, back and labels. We'll tell you if we need anything else.
          </p>
        </div>

        <PrototypeControls title="Prototype: which shirt is in the photos?">
          {samples.map((x) => {
            const c = getClub(x.clubId)!;
            const on = x.clubId === shirt.clubId && x.type === shirt.type && x.season === shirt.season;
            return (
              <DemoButton key={`${x.clubId}${x.season}`} onClick={() => set({ shirt: x })}>
                {on ? "● " : ""}
                {c.initials} {x.type} {x.season}
                {!c.partner && " (not a partner)"}
              </DemoButton>
            );
          })}
          <span className="w-full" />
          <DemoButton onClick={() => setNextVerdict(s.demo.nextVerdict === "authentic" ? "counterfeit" : "authentic")}>
            Background check result: {s.demo.nextVerdict === "authentic" ? "Authentic" : "Counterfeit"}
          </DemoButton>
          <DemoButton onClick={() => set({ shirt, slots: { ...draft.slots, front: { status: "uploaded" }, back: { status: "uploaded" }, "wash-label": { status: "uploaded" } } })}>
            Add 3 sample photos
          </DemoButton>
        </PrototypeControls>

        <UploadZone surface={surface} draft={draft} onSlots={(slots) => set({ slots })} />

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {SLOTS.map((slot) => (
            <SlotTileWrapper key={slot.id} slot={slot.id} draft={draft} kit={kit} surface={surface} setSlot={setSlot} />
          ))}
        </div>

        {surface === "store" && (
          <Handoff
            draftId={draft.id}
            title="Rather use your phone's camera?"
            text="Scan to take the photos on your phone. Anything you've added here comes with you."
          />
        )}

        <Button block disabled={draft.slots.front?.status !== "uploaded"} onClick={() => {
          set({ shirt });
          setProcessing(true);
        }}>
          Continue
        </Button>
        {onSaveForLater && Object.keys(draft.slots).length > 0 && (
          <button onClick={onSaveForLater} className="block w-full text-center text-sm font-semibold text-neutral-500">
            Save and finish later
          </button>
        )}
      </>,
    );

  // ---- Review: required photos per brand ----------------------------------
  if (draft.step === "review") {
    const required = mandatorySlots(club, shirt.season);
    const missing = required.filter((id) => !draft.slots[id]);
    const optional = SLOTS.map((x) => x.id).filter((id) => !required.includes(id));

    return wrap(
      <>
        {header}
        <ShirtCard shirt={shirt} onChange={(x) => set({ shirt: x })} />

        <section className="space-y-2">
          <h2 className="font-bold">Photos we need for a {club.brand} shirt</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {required.map((id) => (
              <div key={id} className="space-y-1">
                <SlotTileWrapper slot={id} draft={draft} kit={kit} surface={surface} setSlot={setSlot} required />
                {!draft.slots[id] && <MissingReason onPick={(status) => setSlot(id, { status })} />}
              </div>
            ))}
          </div>
        </section>

        {missing.length > 0 &&
          (surface === "store" ? (
            <Handoff
              draftId={draft.id}
              title={`${missing.length} more photo${missing.length > 1 ? "s" : ""} to go`}
              text={`Finish on your phone: ${missing.map((m) => SLOT_LABEL[m].toLowerCase()).join(", ")}. Everything you've done so far is saved.`}
            />
          ) : (
            <p className="rounded-2xl bg-accent/5 p-3 text-sm">
              <span className="font-semibold">{missing.length} more to go.</span> Tap a slot to take the photo, or tell us
              why it's missing.
            </p>
          ))}

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-neutral-500">More photos (optional, but they help it sell)</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {optional.map((id) => (
              <SlotTileWrapper key={id} slot={id} draft={draft} kit={kit} surface={surface} setSlot={setSlot} />
            ))}
          </div>
        </section>

        {missing.length > 0 && (
          <PrototypeControls title="Prototype">
            <DemoButton onClick={() => set({ slots: { ...draft.slots, ...Object.fromEntries(missing.map((m) => [m, { status: "uploaded" }])) } })}>
              Fill the missing ones with samples
            </DemoButton>
          </PrototypeControls>
        )}

        <Button block disabled={missing.length > 0} onClick={() => set({ step: "details", size: draft.size ?? "M", condition: draft.condition ?? "Excellent" })}>
          Continue
        </Button>
        {onSaveForLater && (
          <button onClick={onSaveForLater} className="block w-full text-center text-sm font-semibold text-neutral-500">
            Save and finish later
          </button>
        )}
      </>,
    );
  }

  // ---- Details -------------------------------------------------------------
  if (draft.step === "details")
    return wrap(
      <>
        {header}
        <h1 className="text-xl font-bold">About your shirt</h1>
        <ShirtCard shirt={shirt} />
        <Picker label="Size" options={["XS", "S", "M", "L", "XL", "XXL"] as Size[]} value={draft.size} onChange={(size) => set({ size })} />
        <Picker
          label="Condition"
          options={["Brand new", "Excellent", "Good", "Fair"] as Condition[]}
          value={draft.condition}
          onChange={(condition) => set({ condition })}
        />
        <Picker
          label="Version"
          options={["Stadium", "Player", "Not sure"] as KitVersion[]}
          value={draft.version}
          onChange={(version) => set({ version })}
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-bold">Name and number (optional)</span>
          <input
            value={draft.printing ?? ""}
            onChange={(e) => set({ printing: e.target.value.toUpperCase() || undefined })}
            placeholder="e.g. REYES 9"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>
        <Button block disabled={!draft.size || !draft.condition} onClick={() => set({ step: "price" })}>
          Continue
        </Button>
      </>,
    );

  // ---- Price ---------------------------------------------------------------
  return wrap(
    <PriceStep
      header={header}
      draft={draft}
      shirt={shirt}
      club={club}
      onSubmit={() => setSubmittedId(submitDraft(draft.id))}
    />,
  );
}

function PriceStep({ header, draft, shirt, club, onSubmit }: { header: ReactNode; draft: Draft; shirt: Shirt; club: Club; onSubmit: () => void }) {
  const [text, setText] = useState(draft.price ? (draft.price / 100).toFixed(2) : "");
  const price = Math.round(parseFloat(text || "0") * 100);
  const value = valueShirt(shirt, draft.condition!, draft.size!);
  const options = payoutOptions(price, shirt.clubId);

  const setPrice = (t: string) => {
    setText(t);
    updateDraft(draft.id, { price: Math.round(parseFloat(t || "0") * 100) || undefined });
  };

  return (
    <>
      {header}
      <h1 className="text-xl font-bold">Set your price</h1>

      <div className="space-y-3 rounded-2xl bg-ink p-4 text-white">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4" /> Estimated value
        </p>
        <p className="text-3xl font-bold">
          {formatGBP(value.low)} – {formatGBP(value.high)}
        </p>
        <p className="text-xs text-white/70">
          Based on {value.basedOn} sales of {club.name} {shirtTitle(shirt)} shirts in {draft.condition?.toLowerCase()} condition.
        </p>
        <button
          onClick={() => setPrice((value.suggested / 100).toFixed(2))}
          className="rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-ink"
        >
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
                  <span className="ml-1.5 text-xs text-neutral-500">
                    {o.method === "club_credit" ? "110%, best value" : o.method === "bank" ? "5% + 50p fee" : ""}
                  </span>
                </span>
                <span className={clsx("font-semibold", o.method === "club_credit" && "text-accent")}>{formatGBP(o.amount)}</span>
              </div>
            ))}
            {!club.partner && (
              <p className="mt-2 text-xs text-neutral-500">
                {club.name} isn't a Locker partner yet, so club credit isn't available for this shirt.
              </p>
            )}
            <p className="mt-2 border-t border-neutral-200 pt-2 text-xs text-neutral-500">
              Buyers pay {formatGBP(allInPrice(price))} including buyer protection, plus postage.
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
                <span className="font-semibold">High-value shirt.</span> We'll post you a free FanNFC tag to fix to it
                before you send it, so the buyer can tap to prove it's the real one.
              </p>
            </div>
          )}
        </>
      )}

      <Button block disabled={price < 500} onClick={onSubmit}>
        List it for free
      </Button>
    </>
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
          We're checking a few details. It usually takes a few minutes. We'll email {owner.email} when it's live, so you
          can close this page.
        </p>
      </div>
    );

  if (listing.status === "rejected")
    return (
      <div className="space-y-4 py-8 text-center">
        <h1 className="text-2xl font-bold">We couldn't list this shirt</h1>
        <p className="mx-auto max-w-sm text-sm text-neutral-500">
          Our authentication team found details that don't match an official {club.name} shirt. You haven't been charged
          anything.
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

// ---- Pieces --------------------------------------------------------------

function UploadZone({ surface, draft, onSlots }: { surface: "app" | "store"; draft: Draft; onSlots: (slots: Draft["slots"]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  // Stand-in for KitLegit sorting photos into slots: fill the empty slots in order.
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const slots = { ...draft.slots };
    for (const file of Array.from(files)) {
      const free = SLOTS.find((x) => !slots[x.id]);
      if (!free) break;
      slots[free.id] = { status: "uploaded", thumb: await fileToThumb(file) };
    }
    onSlots(slots);
    setBusy(false);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        add(e.dataTransfer.files);
      }}
      onClick={() => input.current?.click()}
      className={clsx(
        "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition",
        over ? "border-accent bg-accent/5" : "border-neutral-300 hover:border-accent",
      )}
    >
      {busy ? <Loader2 className="h-7 w-7 animate-spin text-accent" /> : surface === "app" ? <ImagePlus className="h-7 w-7 text-accent" /> : <Upload className="h-7 w-7 text-accent" />}
      <p className="font-semibold">{surface === "app" ? "Take or choose photos" : "Click or drop photos here"}</p>
      <p className="text-xs text-neutral-500">Add them all at once. We'll sort them into the right slots.</p>
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
    </div>
  );
}

function SlotTileWrapper({
  slot,
  draft,
  kit,
  surface,
  setSlot,
  required,
}: {
  slot: SlotId;
  draft: Draft;
  kit: Club["kits"][ShirtType];
  surface: "app" | "store";
  setSlot: (slot: SlotId, photo: SlotPhoto | undefined) => void;
  required?: boolean;
}) {
  return (
    <SlotTile
      slot={slot}
      photo={draft.slots[slot]}
      kit={kit}
      required={required}
      capture={surface === "app"}
      onPhoto={(p) => setSlot(slot, p)}
      onClear={() => setSlot(slot, undefined)}
    />
  );
}


function MissingReason({ onPick }: { onPick: (status: Exclude<SlotPhoto["status"], "uploaded">) => void }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="w-full text-center text-[11px] font-medium text-neutral-500 underline">
        I don't have it
      </button>
    );
  return (
    <div className="space-y-1">
      {MISSING_REASONS.map((r) => (
        <button key={r.status} onClick={() => onPick(r.status)} className="block w-full rounded-lg bg-neutral-100 px-1.5 py-1 text-[10px] font-medium">
          {r.label}
        </button>
      ))}
    </div>
  );
}

function ShirtCard({ shirt, onChange }: { shirt: Shirt; onChange?: (s: Shirt) => void }) {
  const [editing, setEditing] = useState(false);
  const club = getClub(shirt.clubId)!;

  return (
    <div className="space-y-3 rounded-2xl bg-tile p-3">
      <div className="flex items-center gap-3">
        <Crest club={club} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-neutral-500">{onChange ? "We think it's" : "Your shirt"}</p>
          <p className="truncate font-semibold">
            {club.name} {shirtTitle(shirt)}
          </p>
          <p className="text-xs text-neutral-500">
            {club.brand}
            {!club.partner && " · not a Locker partner club"}
          </p>
        </div>
        {onChange && !editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-semibold text-accent">
            <Pencil className="h-3.5 w-3.5" /> Not right?
          </button>
        )}
      </div>
      {onChange && editing && (
        <div className="grid grid-cols-3 gap-2 text-sm">
          <select value={shirt.clubId} onChange={(e) => onChange({ ...shirt, clubId: e.target.value })} className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5">
            {CLUBS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={shirt.type} onChange={(e) => onChange({ ...shirt, type: e.target.value as ShirtType })} className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5">
            {(["Home", "Away", "Third", "Goalkeeper"] as ShirtType[]).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select value={shirt.season} onChange={(e) => onChange({ ...shirt, season: e.target.value })} className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5">
            {SEASONS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function Picker<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value?: T; onChange: (v: T) => void }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-bold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={clsx("rounded-full px-3.5 py-1.5 text-sm font-medium", value === o ? "bg-ink text-white" : "bg-neutral-100 text-neutral-700")}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
