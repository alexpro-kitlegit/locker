import clsx from "clsx";
import { Grip, Info, MoreHorizontal, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { isDeclared, isLabelSlot, slotLabel } from "../../data/slots";
import type { Kit, SlotKey, SlotState, SlotStatus } from "../../lib/types";
import { PhotoView } from "./PhotoGuide";

export type SlotAction =
  | { type: "file"; file: File }
  | { type: "remove" }
  | { type: "reset" }
  | { type: "damaged" }
  | { type: "not-present-or-removed" }
  | { type: "guide" }
  | { type: "move" };

const BANNER: Partial<Record<SlotStatus, string>> = {
  blurry: "Blurry",
  dark: "Too Dark",
  damaged: "Damaged / unreadable",
  unreadable: "Damaged / unreadable",
  removed: "Label removed",
};

/** KitLegit's SlotCard: title row, photo area, status banner and footer (links or an Options menu). */
export function SlotCard({
  slot,
  state,
  mandatory,
  kit,
  wide,
  onAction,
  onDropFrom,
}: {
  slot: SlotKey;
  state?: SlotState;
  mandatory: boolean;
  kit?: Kit;
  wide: boolean;
  onAction: (a: SlotAction) => void;
  onDropFrom: (from: SlotKey) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState(false);
  const [over, setOver] = useState(false);
  const photo = state?.photo;
  const status = state?.status ?? "empty";
  const declared = isDeclared(state);
  const missing = mandatory && !photo && !declared;
  const evidenceNeeded = (status === "damaged" || status === "unreadable" || status === "removed") && !photo;
  const label = isLabelSlot(slot);

  return (
    <div
      onDragOver={(e) => {
        if (!wide) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const from = e.dataTransfer.getData("text/slot") as SlotKey;
        if (from) onDropFrom(from);
        else if (e.dataTransfer.files[0]) onAction({ type: "file", file: e.dataTransfer.files[0] });
      }}
      className={clsx(
        "relative flex flex-col overflow-visible rounded-xl border bg-white",
        missing ? "border-red-400" : "border-neutral-200",
        over && "ring-2 ring-accent",
      )}
    >
      {(BANNER[status] || evidenceNeeded) && (
        <p className={clsx("rounded-t-xl px-2 py-1 text-[10px] font-semibold", photo || status === "blurry" || status === "dark" ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-600")}>
          {evidenceNeeded ? "Evidence required" : BANNER[status]}
          {declared && photo && " · Evidence uploaded"}
        </p>
      )}

      <div className="flex items-center gap-1 px-2 pt-1.5">
        {!slot.startsWith("other") && (
          <button onClick={() => onAction({ type: "guide" })} className="text-neutral-400 hover:text-ink" aria-label="Where to find it">
            <Info className="h-3.5 w-3.5" />
          </button>
        )}
        <span className="truncate text-[10px] font-bold uppercase tracking-wide">{slotLabel(slot)}</span>
        {missing && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />}
      </div>

      <div className="group relative m-1.5 aspect-[3/4] overflow-hidden rounded-lg bg-neutral-50">
        {photo ? (
          <div
            draggable={wide}
            onDragStart={(e) => e.dataTransfer.setData("text/slot", slot)}
            className={clsx("h-full w-full", (status === "blurry" || status === "dark") && "opacity-50", wide && "cursor-grab")}
          >
            <PhotoView photo={photo} kit={kit} />
            {wide && (
              <span className="absolute right-1 top-1 hidden rounded bg-white/90 p-0.5 group-hover:block">
                <Grip className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        ) : status === "not-present" ? (
          <div className="relative grid h-full place-items-center">
            <X className="absolute h-full w-full text-neutral-200" strokeWidth={0.5} />
            <span className="relative rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-600">Not present</span>
          </div>
        ) : (
          <button onClick={() => input.current?.click()} className="grid h-full w-full place-items-center text-[11px] text-neutral-400">
            {evidenceNeeded ? <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">Upload Evidence</span> : "+ Add photo"}
          </button>
        )}
        {(status === "blurry" || status === "dark") && (
          <button onClick={() => input.current?.click()} className="absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-white">
            Retake
          </button>
        )}
      </div>

      <div className="relative px-2 pb-2 text-[11px]">
        {label ? (
          <>
            <button
              onClick={() => setMenu(!menu)}
              className={clsx(
                "flex w-full items-center justify-center gap-1 rounded-full py-1 font-semibold",
                missing ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-700",
              )}
            >
              Options <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {menu && (
              <div className="absolute bottom-9 left-0 z-20 w-52 rounded-xl border border-neutral-200 bg-white py-1 text-xs shadow-xl" onMouseLeave={() => setMenu(false)}>
                {status === "not-present" ? (
                  <>
                    <MenuItem onClick={() => onAction({ type: "reset" })}>Reset slot</MenuItem>
                    <MenuItem onClick={() => onAction({ type: "guide" })}>ⓘ Where to find</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem onClick={() => input.current?.click()}>{photo ? "Replace photo" : "Upload photo"}</MenuItem>
                    {!wide && photo && <MenuItem onClick={() => onAction({ type: "move" })}>Move to another slot…</MenuItem>}
                    {photo && (
                      <MenuItem danger onClick={() => onAction({ type: "remove" })}>
                        <Trash2 className="h-3.5 w-3.5" /> Remove photo
                      </MenuItem>
                    )}
                    <MenuItem onClick={() => onAction({ type: "guide" })}>ⓘ Where to find</MenuItem>
                    <MenuItem onClick={() => onAction({ type: "damaged" })}>Mark as damaged / unreadable</MenuItem>
                    <MenuItem onClick={() => onAction({ type: "not-present-or-removed" })}>Mark as not originally present</MenuItem>
                    <MenuItem onClick={() => onAction({ type: "not-present-or-removed" })}>Mark as removed</MenuItem>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-center font-semibold text-accent">
            <button onClick={() => input.current?.click()}>{photo ? "Replace" : "Upload"}</button>
            {photo && (
              <>
                {" · "}
                <button onClick={() => onAction({ type: "remove" })}>Remove</button>
                {!wide && (
                  <>
                    {" · "}
                    <button onClick={() => onAction({ type: "move" })}>Move</button>
                  </>
                )}
              </>
            )}
          </p>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAction({ type: "file", file });
          e.target.value = "";
          setMenu(false);
        }}
      />
    </div>
  );

  function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
    return (
      <button
        onClick={() => {
          onClick();
          setMenu(false);
        }}
        className={clsx("flex w-full items-center gap-1.5 px-3 py-2 text-left hover:bg-neutral-50", danger && "text-red-600")}
      >
        {children}
      </button>
    );
  }
}
