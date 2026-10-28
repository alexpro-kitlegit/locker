import clsx from "clsx";
import { ChevronLeft, ChevronRight, Tag, X } from "lucide-react";
import { useState } from "react";
import { getClub } from "../../data/clubs";
import { NAMED_SLOTS } from "../../data/slots";
import type { Kit, NamedSlot, Photo } from "../../lib/types";
import { ShirtArt } from "../ShirtArt";

/** Draws a photo: the real upload, or prototype art for a sample photo. */
export function PhotoView({ photo, kit, className }: { photo: Photo; kit?: Kit; className?: string }) {
  if (photo.thumb) return <img src={photo.thumb} alt="" className={clsx("h-full w-full object-cover", className)} />;
  const slot = photo.sample;
  return (
    <div className={clsx("grid h-full w-full place-items-center bg-tile", className)}>
      {(slot === "front" || slot === "back") && kit ? (
        <ShirtArt kit={kit} className="h-[75%] w-[75%]" />
      ) : (
        <div className="flex flex-col items-center gap-1 text-neutral-500">
          <Tag className="h-8 w-8" strokeWidth={1.3} />
          <span className="px-1 text-center text-[10px] leading-tight">{NAMED_SLOTS.find((s) => s.id === slot)?.label ?? "Photo"}</span>
        </div>
      )}
    </div>
  );
}

const LOCATION_GROUPS: NamedSlot[][] = [
  ["front", "back"],
  ["neck-label", "wash-label", "style-code", "security-label"],
  ["hologram", "swing-tag"],
];

/** KitLegit's PhotoGuideDrawer: Location Guide and per-slot Photo Guides. */
export function PhotoGuideDrawer({
  brand,
  clubId,
  start,
  required,
  onClose,
}: {
  brand?: string;
  clubId?: string;
  start?: NamedSlot;
  required?: NamedSlot[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"location" | "guides">(start ? "guides" : "location");
  const [index, setIndex] = useState(Math.max(0, NAMED_SLOTS.findIndex((s) => s.id === start)));
  const slot = NAMED_SLOTS[index];
  const kit = getClub(clubId)?.kits.Home;
  const listed = (id: NamedSlot) => !brand || !required || required.includes(id) || ["neck-label", "hologram", "swing-tag"].includes(id);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{brand ? `${brand} Photo Guide` : "Photo Guide"}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-neutral-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-4 grid grid-cols-2 rounded-full bg-neutral-100 p-1 text-sm font-semibold">
          {(["location", "guides"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={clsx("rounded-full py-1.5", tab === t && "bg-white shadow-sm")}>
              {t === "location" ? "Location Guide" : "Photo Guides"}
            </button>
          ))}
        </div>

        {tab === "location" ? (
          <div className="space-y-3">
            <div className="grid aspect-[4/5] place-items-center rounded-2xl bg-ink">{kit && <ShirtArt kit={kit} className="h-2/3 w-2/3" />}</div>
            {LOCATION_GROUPS.map((group, gi) => (
              <div key={gi} className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
                {group.filter(listed).map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      setIndex(NAMED_SLOTS.findIndex((s) => s.id === id));
                      setTab("guides");
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{NAMED_SLOTS.find((s) => s.id === id)!.label}</span>
                    <span className="text-xs font-semibold text-accent">Find it ›</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid aspect-square place-items-center rounded-2xl bg-tile text-xs text-neutral-400">
              <PhotoView photo={{ id: "guide", sample: slot.id }} kit={kit} />
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setIndex((index + NAMED_SLOTS.length - 1) % NAMED_SLOTS.length)} className="rounded-full p-1 hover:bg-neutral-100" aria-label="Previous slot">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="font-bold">{slot.label}</h3>
              <button onClick={() => setIndex((index + 1) % NAMED_SLOTS.length)} className="rounded-full p-1 hover:bg-neutral-100" aria-label="Next slot">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-neutral-600">{slot.description}</p>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Where to find it</p>
              <p className="text-sm">{slot.where}</p>
            </div>
            <div className="flex justify-center gap-1.5">
              {NAMED_SLOTS.map((s, i) => (
                <button key={s.id} onClick={() => setIndex(i)} className={clsx("h-1.5 rounded-full", i === index ? "w-4 bg-accent" : "w-1.5 bg-neutral-300")} aria-label={s.label} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
