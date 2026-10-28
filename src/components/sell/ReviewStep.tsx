import clsx from "clsx";
import { CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getClub } from "../../data/clubs";
import { isDeclared, MAX_PHOTOS, NAMED_SLOTS, OTHER_SLOTS, slotLabel, STATUS_TAG } from "../../data/slots";
import { readPhoto, validatePhoto } from "../../lib/images";
import type { Draft, Kit, NamedSlot, SlotKey } from "../../lib/types";
import { blockers, fillFree, freeOther, mandatoryFor, movePhoto, newPhotoId, patchDraft, remainingSlots } from "./flow";
import { PhotoView } from "./PhotoGuide";
import { Sheet, SheetButton } from "./Sheet";
import { SlotCard, type SlotAction } from "./SlotCard";
import { toast } from "./toast";

let bannerDismissed = false;

/**
 * KitLegit's Review step. The bar's "Review" button increments `cta`; this step then runs KitLegit's checks
 * in order (hard block, then security code confirmation) and calls onPassed.
 */
export function ReviewStep({
  draft,
  kit,
  wide,
  cta,
  onPassed,
  openGuide,
  handoff,
  demo,
}: {
  draft: Draft;
  kit?: Kit;
  wide: boolean;
  cta: number;
  onPassed: () => void;
  openGuide: (slot?: NamedSlot) => void;
  handoff: (missing: string[]) => ReactNode;
  demo: ReactNode;
}) {
  const [banner, setBanner] = useState(!bannerDismissed);
  const [npr, setNpr] = useState<SlotKey | null>(null);
  const [moving, setMoving] = useState<SlotKey | null>(null);
  const [fix, setFix] = useState<ReturnType<typeof blockers> | null>(null);
  const [securityOpen, setSecurityOpen] = useState(false);
  const firstCta = useRef(cta);
  const mandatory = mandatoryFor(draft);
  const club = getClub(draft.identified?.clubId);

  // Which named slots to show: style code and security label are hidden when not required and untouched.
  const visible = NAMED_SLOTS.map((s) => s.id).filter(
    (id) => !((id === "style-code" || id === "security-label") && !mandatory.includes(id) && !draft.slots[id]),
  );
  const ordered = [...visible.filter((id) => mandatory.includes(id)), ...visible.filter((id) => !mandatory.includes(id))];
  const row1 = ordered.slice(0, 6);
  const row2: SlotKey[] = [...ordered.slice(6), ...OTHER_SLOTS];
  const missingPhotos = blockers(draft).filter((b) => b.missingPhoto).map((b) => slotLabel(b.missingPhoto!).toLowerCase());

  useEffect(() => {
    if (cta === firstCta.current) return;
    const rows = blockers(draft);
    if (rows.length) return setFix(rows);
    if (draft.slots["security-label"]?.photo && draft.securityCode === undefined) return setSecurityOpen(true);
    onPassed();
  }, [cta]);

  const setSlots = (slots: Draft["slots"]) => patchDraft(draft.id, () => ({ slots }));

  const act = async (slot: SlotKey, a: SlotAction) => {
    const s = draft.slots[slot];
    switch (a.type) {
      case "file": {
        const read = await readPhoto(a.file).catch(() => null);
        const problem = validatePhoto(a.file, read);
        if (problem) return toast(problem);
        const all = Object.values(draft.slots);
        if (all.some((x) => x?.photo?.thumb === read!.thumb)) return toast("This photo is already uploaded in another slot.");
        const photo = { id: newPhotoId(), thumb: read!.thumb };
        if (isDeclared(s) && s!.status !== "not-present") {
          toast("Saved as evidence. Status kept.", { warn: false });
          return setSlots({ ...draft.slots, [slot]: { ...s!, photo } });
        }
        return setSlots({ ...draft.slots, [slot]: { status: "uploaded", photo } });
      }
      case "remove": {
        const next = { ...draft.slots };
        if (isDeclared(s)) next[slot] = { status: s!.status };
        else delete next[slot];
        return setSlots(next);
      }
      case "reset": {
        const next = { ...draft.slots };
        delete next[slot];
        return setSlots(next);
      }
      case "damaged":
        return setSlots({ ...draft.slots, [slot]: { status: "damaged", photo: s?.photo } });
      case "not-present-or-removed":
        return setNpr(slot);
      case "guide":
        return openGuide(slot.startsWith("other") ? undefined : (slot as NamedSlot));
      case "move":
        return setMoving(slot);
    }
  };

  const addMore = async (files: FileList | null) => {
    if (!files?.length) return;
    const photos = [];
    for (const f of Array.from(files)) {
      const read = await readPhoto(f).catch(() => null);
      const problem = validatePhoto(f, read);
      if (problem) toast(problem);
      else photos.push({ id: newPhotoId(), thumb: read!.thumb });
    }
    const { slots, skipped } = fillFree(draft.slots, photos);
    if (skipped) toast(`${skipped} photo(s) skipped. Only ${photos.length - skipped} slot(s) remaining.`);
    setSlots(slots);
  };

  const card = (slot: SlotKey) => (
    <SlotCard
      key={slot}
      slot={slot}
      state={draft.slots[slot]}
      mandatory={mandatory.includes(slot as NamedSlot)}
      kit={kit}
      wide={wide}
      onAction={(a) => act(slot, a)}
      onDropFrom={(from) => setSlots(movePhoto(draft.slots, from, slot))}
    />
  );

  const left = (
    <div className="space-y-4">
      {demo}
      {wide && banner && (
        <div className="flex items-center justify-between rounded-xl bg-accent/5 px-3 py-2 text-sm">
          Drag photos between slots to reassign them
          <button
            onClick={() => {
              bannerDismissed = true;
              setBanner(false);
            }}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {missingPhotos.length > 0 && handoff(missingPhotos)}
      <div className={clsx("grid gap-2", wide ? "grid-cols-6" : "grid-cols-2")}>{row1.map(card)}</div>
      <div className={clsx("grid gap-2", wide ? "grid-cols-6" : "grid-cols-2")}>{row2.map(card)}</div>
      <AddMore remaining={remainingSlots(draft.slots)} onFiles={addMore} />
    </div>
  );

  const right = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 p-4 text-sm">
        <h3 className="mb-2 font-bold">Item Details</h3>
        <p className="flex justify-between py-1">
          <span className="text-neutral-500">Team</span> <span className="font-medium">{club?.name}</span>
        </p>
        <p className="flex justify-between py-1">
          <span className="text-neutral-500">Brand</span> <span className="font-medium">{draft.identified?.brand}</span>
        </p>
      </div>
      <div className="rounded-2xl border border-neutral-200 p-4 text-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-bold">Photos</h3>
          <button onClick={() => openGuide()} className="text-xs font-semibold text-accent">
            Photo guide
          </button>
        </div>
        {visible.map((id) => {
          const s = draft.slots[id];
          const ok = s?.photo && s.status === "uploaded";
          const tag = s && STATUS_TAG[s.status] ? STATUS_TAG[s.status] : mandatory.includes(id) ? "Required" : "Optional";
          return (
            <div key={id} className="flex items-center gap-2 py-1.5">
              <button onClick={() => openGuide(id)} aria-label="Where to find it">
                <Info className="h-3.5 w-3.5 text-neutral-400" />
              </button>
              <span className="flex-1">{slotLabel(id)}</span>
              {ok ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-semibold", tag === "Required" ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-600")}>{tag}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {wide ? (
        <div className="grid grid-cols-[1fr_256px] gap-6">
          {left}
          {right}
        </div>
      ) : (
        left
      )}

      {npr && <NotPresentOrRemoved slot={npr} draft={draft} onClose={() => setNpr(null)} />}
      {moving && <MoveSheet from={moving} draft={draft} mandatory={mandatory} onClose={() => setMoving(null)} />}
      {fix && (
        <Sheet title="Please fix the following" sub="You cannot proceed until all issues below are resolved." onClose={() => setFix(null)}>
          <ul className="space-y-1.5 pb-2">
            {fix.map((r) => (
              <li key={r.text} className="flex gap-2 text-sm text-red-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" /> {r.text}
              </li>
            ))}
          </ul>
          {fix.some((r) => r.missingPhoto) && handoff(missingPhotos)}
          <SheetButton variant="primary" onClick={() => setFix(null)}>
            ← Go Back and Fix
          </SheetButton>
        </Sheet>
      )}
      {securityOpen && (
        <SecurityCode
          draft={draft}
          kit={kit}
          onClose={() => setSecurityOpen(false)}
          onDone={(code) => {
            patchDraft(draft.id, () => ({ securityCode: code }));
            setSecurityOpen(false);
            onPassed();
          }}
        />
      )}
    </>
  );
}

function AddMore({ remaining, onFiles }: { remaining: number; onFiles: (f: FileList | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const full = remaining <= 0;
  return (
    <button
      onClick={() => !full && input.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!full) onFiles(e.dataTransfer.files);
      }}
      className={clsx("w-full rounded-2xl border-2 border-dashed p-4 text-center text-sm", full ? "border-neutral-200 text-neutral-400" : "border-neutral-300 hover:border-accent")}
    >
      {full ? (
        "All slots filled. Remove a photo to add more"
      ) : (
        <>
          <span className="font-semibold">Add more photos</span>
          <span className="block text-xs text-neutral-500">
            {Math.min(remaining, MAX_PHOTOS)} slots remaining · drag between slots to reassign
          </span>
        </>
      )}
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
    </button>
  );
}

function NotPresentOrRemoved({ slot, draft, onClose }: { slot: SlotKey; draft: Draft; onClose: () => void }) {
  const [choice, setChoice] = useState<"not-present" | "removed">();
  const apply = () => {
    const next = { ...draft.slots };
    const photo = next[slot]?.photo;
    if (choice === "not-present") {
      // KitLegit moves any existing photo to a free Other slot.
      const other = photo ? freeOther(next) : undefined;
      if (other && photo) next[other] = { status: "uploaded", photo };
      next[slot] = { status: "not-present" };
    } else next[slot] = { status: "removed", photo };
    patchDraft(draft.id, () => ({ slots: next }));
    onClose();
  };
  const cards = [
    { id: "not-present" as const, title: "Originally Not Present", body: "Item originally not present on shirt." },
    { id: "removed" as const, title: "Element Removed", body: "With clear, evident signs of removal." },
  ];
  return (
    <Sheet title="Not Present or Removed?" sub={`Choose how to mark the ${slotLabel(slot)}.`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2 pb-2">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => setChoice(c.id)}
            className={clsx("rounded-2xl border p-3 text-left", choice === c.id ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-neutral-200")}
          >
            <div className="mb-2 grid aspect-[4/3] place-items-center rounded-lg bg-neutral-100">
              <X className={clsx("h-8 w-8", c.id === "removed" ? "text-amber-500" : "text-neutral-300")} />
            </div>
            <p className="text-sm font-semibold">{c.title}</p>
            <p className="text-xs text-neutral-500">{c.body}</p>
          </button>
        ))}
      </div>
      <SheetButton variant="primary" disabled={!choice} onClick={apply}>
        Confirm Choice
      </SheetButton>
      <SheetButton variant="ghost" onClick={onClose}>
        Cancel
      </SheetButton>
    </Sheet>
  );
}

function MoveSheet({ from, draft, mandatory, onClose }: { from: SlotKey; draft: Draft; mandatory: NamedSlot[]; onClose: () => void }) {
  const targets: SlotKey[] = [...mandatory, ...OTHER_SLOTS].filter((k) => k !== from);
  return (
    <Sheet eyebrow="Move photo" title={slotLabel(from)} sub="Select a destination slot" onClose={onClose}>
      {targets.map((t) => (
        <button
          key={t}
          onClick={() => {
            patchDraft(draft.id, (d) => ({ slots: movePhoto(d.slots, from, t) }));
            onClose();
          }}
          className="flex w-full items-center justify-between rounded-xl border border-neutral-200 px-3 py-2.5 text-left text-sm"
        >
          <span className="font-medium">{slotLabel(t)}</span>
          <span className="text-xs text-neutral-500">{draft.slots[t]?.photo ? "Existing photo moves to Other" : "Move here"}</span>
        </button>
      ))}
    </Sheet>
  );
}

function SecurityCode({ draft, kit, onClose, onDone }: { draft: Draft; kit?: Kit; onClose: () => void; onDone: (code: string) => void }) {
  const detected = draft.identified?.brand === "adidas" ? "IQ0893" : "D64226F23M";
  const [code, setCode] = useState("");
  const photo = draft.slots["security-label"]!.photo!;
  return (
    <Sheet
      title="Confirm security code"
      onClose={onClose}
      top={
        <div className="mb-4 aspect-[4/3] overflow-hidden rounded-xl">
          <PhotoView photo={photo} kit={kit} />
        </div>
      }
    >
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
        <span className="font-semibold">Critical step:</span> verify every character against the photo.
      </p>
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Detected code - verify every character</p>
          <p className="font-mono text-lg font-bold">{detected}</p>
        </div>
        <button onClick={() => setCode(detected)} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">
          Fill Below
        </button>
      </div>
      <input
        value={code}
        maxLength={20}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder={detected}
        className="w-full rounded-xl border border-neutral-200 px-3 py-3 font-mono text-xl tracking-widest outline-none focus:border-accent"
      />
      <div className="grid grid-cols-2 gap-2 pt-1">
        <SheetButton onClick={() => onDone("")}>Skip</SheetButton>
        <SheetButton variant="primary" disabled={code.length < 4} onClick={() => onDone(code)}>
          Confirm
        </SheetButton>
      </div>
    </Sheet>
  );
}
