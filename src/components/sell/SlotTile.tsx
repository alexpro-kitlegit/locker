import clsx from "clsx";
import { Camera, Plus, Tag, X } from "lucide-react";
import { useRef } from "react";
import { SLOT_LABEL } from "../../data/slots";
import { fileToThumb } from "../../lib/images";
import type { Kit, SlotId, SlotPhoto } from "../../lib/types";
import { ShirtArt } from "../ShirtArt";
import { TickCircle } from "../ui";

const MISSING_LABEL = { "not-present": "Never had one", removed: "Removed", damaged: "Damaged" } as const;

/** One photo slot. Tapping an empty slot opens the camera on a phone, or the file picker on a computer. */
export function SlotTile({
  slot,
  photo,
  kit,
  required,
  capture,
  onPhoto,
  onClear,
}: {
  slot: SlotId;
  photo?: SlotPhoto;
  kit?: Kit;
  required?: boolean;
  capture: boolean;
  onPhoto: (p: SlotPhoto) => void;
  onClear: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const filled = photo?.status === "uploaded";
  const missing = photo && photo.status !== "uploaded";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !photo && input.current?.click()}
        className={clsx(
          "flex aspect-square w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl text-center text-[11px] font-medium",
          filled && "bg-tile",
          missing && "bg-neutral-100 text-neutral-500",
          !photo && (required ? "border-2 border-dashed border-accent/60 text-accent" : "border-2 border-dashed border-neutral-200 text-neutral-500"),
        )}
      >
        {filled && photo.thumb ? (
          <img src={photo.thumb} alt={SLOT_LABEL[slot]} className="h-full w-full object-cover" />
        ) : filled ? (
          <>
            {(slot === "front" || slot === "back") && kit ? (
              <ShirtArt kit={kit} className="h-[60%] w-[60%]" />
            ) : (
              <Tag className="h-7 w-7 text-neutral-500" strokeWidth={1.4} />
            )}
            <span className="px-1 leading-tight">{SLOT_LABEL[slot]}</span>
          </>
        ) : missing ? (
          <>
            <X className="h-5 w-5" />
            <span className="px-1 leading-tight">{SLOT_LABEL[slot]}</span>
            <span className="text-[10px]">{MISSING_LABEL[photo.status as keyof typeof MISSING_LABEL]}</span>
          </>
        ) : (
          <>
            {capture ? <Camera className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            <span className="px-1 leading-tight">{SLOT_LABEL[slot]}</span>
            {required && <span className="text-[10px] font-semibold">Required</span>}
          </>
        )}
      </button>
      {filled && <TickCircle size="sm" className="absolute right-1.5 top-1.5" />}
      {photo && (
        <button
          onClick={onClear}
          className="absolute left-1.5 top-1.5 rounded-full bg-white/90 p-1 shadow-sm"
          aria-label={`Remove ${SLOT_LABEL[slot]}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture={capture ? "environment" : undefined}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) onPhoto({ status: "uploaded", thumb: await fileToThumb(file) });
          e.target.value = "";
        }}
      />
    </div>
  );
}
