import clsx from "clsx";
import { ImageIcon, UploadCloud, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { getClub } from "../../data/clubs";
import { MAX_PHOTOS, MIN_PHOTOS, NAMED_SLOTS } from "../../data/slots";
import { readPhoto, validatePhoto } from "../../lib/images";
import type { Draft, Kit, NamedSlot, Photo } from "../../lib/types";
import { ShirtArt } from "../ShirtArt";
import { newPhotoId, patchDraft } from "./flow";
import { PhotoView } from "./PhotoGuide";
import { toast } from "./toast";

/** KitLegit's Upload step: 3–12 photos into one pool. The analysis sorts them into slots afterwards. */
export function UploadStep({
  draft,
  kit,
  wide,
  capture,
  openGuide,
  demo,
  handoff,
}: {
  draft: Draft;
  kit?: Kit;
  wide: boolean;
  capture: boolean;
  openGuide: (slot?: NamedSlot) => void;
  demo: ReactNode;
  handoff?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const n = draft.pool.length;
  const full = n >= MAX_PHOTOS;

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const added: Photo[] = [];
    let room = MAX_PHOTOS - draft.pool.length;
    let overLimit = 0;
    for (const file of Array.from(files)) {
      if (room <= 0) {
        overLimit++;
        continue;
      }
      const read = await readPhoto(file).catch(() => null);
      const problem = validatePhoto(file, read);
      if (problem) {
        toast(problem);
        continue;
      }
      if ([...draft.pool, ...added].some((p) => p.thumb === read!.thumb)) {
        toast("This photo has already been uploaded.");
        continue;
      }
      added.push({ id: newPhotoId(), thumb: read!.thumb });
      room--;
    }
    if (overLimit) toast(added.length ? `Only the first ${added.length} photo(s) were added. Maximum 12 reached.` : "Maximum 12 photos allowed.");
    if (added.length) patchDraft(draft.id, (d) => ({ pool: [...d.pool, ...added].slice(0, MAX_PHOTOS) }));
  };

  const remove = (id: string) => patchDraft(draft.id, (d) => ({ pool: d.pool.filter((p) => p.id !== id) }));

  const dropZone = (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!full) addFiles(e.dataTransfer.files);
      }}
      onClick={() => !full && input.current?.click()}
      className={clsx(
        "flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition",
        full ? "cursor-default opacity-50" : "cursor-pointer hover:border-accent",
        over ? "border-accent bg-accent/5" : "border-neutral-300",
      )}
    >
      <UploadCloud className="h-7 w-7 text-accent" />
      {wide ? (
        <>
          <p className="font-semibold">{full ? "Maximum 12 photos reached" : "Click or drop photos here"}</p>
          <p className="text-xs text-neutral-500">Min 3 · Max 12 photos · Upload photos of all sides, tags &amp; labels</p>
        </>
      ) : (
        <>
          <p className="font-semibold">Add your photos</p>
          <p className="text-xs text-neutral-500">Min 3 · Max 12 photos · All sides, tags and labels</p>
          <span className="mt-1 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent">Choose Photos</span>
        </>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        capture={capture ? "environment" : undefined}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );

  const grid = (
    <div className={clsx("grid gap-2", wide ? "grid-cols-6" : "grid-cols-3")}>
      {Array.from({ length: MAX_PHOTOS }, (_, i) => draft.pool[i]).map((p, i) =>
        p ? (
          <div key={p.id} className="relative aspect-[4/5] overflow-hidden rounded-xl">
            <PhotoView photo={p} kit={kit} />
            <button onClick={() => remove(p.id)} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-white" aria-label="Remove photo">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button key={`empty-${i}`} onClick={() => input.current?.click()} className="grid aspect-[4/5] place-items-center rounded-xl bg-neutral-50" aria-label="Add photo">
            <ImageIcon className="h-5 w-5 text-neutral-300" />
          </button>
        ),
      )}
    </div>
  );

  const counter = (
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium">
        {n} of {MAX_PHOTOS} photos
      </span>
      {n < MIN_PHOTOS && <span className="text-xs font-semibold text-red-600">Minimum {MIN_PHOTOS} photos required</span>}
    </div>
  );

  const recommended = (
    <div className="rounded-2xl border border-neutral-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold">Recommended Photos</h3>
        <button onClick={() => openGuide()} className="text-xs font-semibold text-accent" title="See photo guide">
          Photo guide
        </button>
      </div>
      <ul className="divide-y divide-neutral-100 text-sm">
        {NAMED_SLOTS.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-2">
            <span>{s.label === "Security Label" ? "Security Labels" : s.label}</span>
            {s.id !== "front" && s.id !== "back" && (
              <button onClick={() => openGuide(s.id)} className="text-xs font-semibold text-accent">
                Find it ›
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  const examples = (
    <div className="rounded-2xl border border-neutral-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold">Example Photos</h3>
        <span className="text-[11px] text-neutral-400">Reference only</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["front", "back", "neck-label", "wash-label"] as NamedSlot[]).map((s) => (
          <div key={s} className="aspect-square overflow-hidden rounded-lg">
            {kit && (s === "front" || s === "back") ? (
              <div className="grid h-full place-items-center bg-tile">
                <ShirtArt kit={kit} className="h-3/4 w-3/4" />
              </div>
            ) : (
              <PhotoView photo={{ id: s, sample: s }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (!wide)
    return (
      <div className="space-y-4">
        {demo}
        {dropZone}
        <button onClick={() => openGuide()} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold">
          Required Photos
        </button>
        {counter}
        {grid}
        {handoff}
      </div>
    );

  return (
    <div className="grid grid-cols-[1fr_256px] gap-6">
      <div className="space-y-4">
        {demo}
        {dropZone}
        {counter}
        {grid}
        {handoff}
      </div>
      <div className="space-y-4">
        {recommended}
        {examples}
      </div>
    </div>
  );
}

/** Prototype helper: sample photos of the chosen shirt (each one knows which slot it shows). */
export function samplePhotos(slots: NamedSlot[]): Photo[] {
  return slots.map((s) => ({ id: newPhotoId(), sample: s }));
}

export const kitFor = (shirt?: Draft["demoShirt"]) => (shirt ? getClub(shirt.clubId)?.kits[shirt.type] : undefined);
