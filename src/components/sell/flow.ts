import { useEffect, useState } from "react";
import { getClub } from "../../data/clubs";
import { ALL_SLOTS, isDeclared, mandatorySlots, MAX_PHOTOS, NAMED_SLOTS, OTHER_SLOTS, slotLabel } from "../../data/slots";
import { updateDraft } from "../../lib/actions";
import { getState } from "../../lib/store";
import type { Draft, NamedSlot, Photo, SlotKey, SlotState } from "../../lib/types";

export const newPhotoId = () => `p-${Math.random().toString(36).slice(2, 9)}`;

/** Saves a change to the draft. Reads fresh state so quick successive edits don't overwrite each other. */
export function patchDraft(id: string, patch: (d: Draft) => Partial<Draft>) {
  const d = getState().drafts.find((x) => x.id === id);
  if (d) updateDraft(id, patch(d));
}

export function photoCount(d: Draft) {
  return d.step === "upload" ? d.pool.length : Object.values(d.slots).filter((s) => s?.photo).length;
}

/** KitLegit's 1024px layout switch: right-hand panels and drag-and-drop on wide screens only. */
export function useWide() {
  const q = "(min-width: 1024px)";
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

/**
 * Stand-in for KitLegit's analyse-photos: sorts the pool into slots and identifies the shirt.
 * Sample photos go to the slot they show. Real photos fill the named slots in order, then the Other slots.
 */
export function analyse(d: Draft, unsure: boolean): Pick<Draft, "slots" | "identified" | "pool" | "step"> {
  const slots: Draft["slots"] = {};
  const leftovers: Photo[] = [];
  for (const p of d.pool) {
    if (p.sample && !slots[p.sample]) slots[p.sample] = { status: "uploaded", photo: p };
    else leftovers.push(p);
  }
  for (const p of leftovers) {
    const free = [...NAMED_SLOTS.map((s) => s.id as SlotKey), ...OTHER_SLOTS].find((k) => !slots[k]);
    if (free) slots[free] = { status: "uploaded", photo: p };
  }

  const shirt = d.demoShirt!;
  const club = getClub(shirt.clubId)!;
  return {
    pool: [],
    slots,
    identified: { clubId: club.id, brand: club.brand, season: unsure ? undefined : shirt.season, type: shirt.type, confident: !unsure },
    step: unsure ? "season" : "review",
  };
}

export function mandatoryFor(d: Draft): NamedSlot[] {
  return d.identified ? mandatorySlots(d.identified.brand, d.identified.season) : ["front", "back", "wash-label"];
}

/** KitLegit's "Please fix the following" rows. Front and back can never be declared missing. */
export function blockers(d: Draft): { text: string; missingPhoto?: SlotKey }[] {
  const rows: { text: string; missingPhoto?: SlotKey }[] = [];
  for (const slot of mandatoryFor(d)) {
    const s = d.slots[slot];
    const canDeclare = slot !== "front" && slot !== "back";
    if (!s?.photo && !(canDeclare && isDeclared(s))) rows.push({ text: `Missing required photo: ${slotLabel(slot)}`, missingPhoto: slot });
  }
  for (const key of ALL_SLOTS) {
    const s = d.slots[key];
    if (!s) continue;
    if ((s.status === "damaged" || s.status === "unreadable" || s.status === "removed") && !s.photo)
      rows.push({ text: `Evidence upload required: ${slotLabel(key)}` });
    if (s.status === "blurry") rows.push({ text: `Blurry photo. Please retake: ${slotLabel(key)}` });
    if (s.status === "dark") rows.push({ text: `Too Dark photo. Please retake: ${slotLabel(key)}` });
  }
  if (!d.identified?.clubId || !d.identified.brand) rows.push({ text: "Missing item details: Team, Brand" });
  return rows;
}

/** First free Other slot, or undefined. */
export const freeOther = (slots: Draft["slots"]) => OTHER_SLOTS.find((k) => !slots[k]?.photo && !slots[k]);

/**
 * KitLegit's drag/move rule: dropping on an occupied slot moves the existing photo to a free Other slot
 * (it's dropped if none is free). Dropping on a declared slot keeps the status and stores the photo as evidence.
 */
export function movePhoto(slots: Draft["slots"], from: SlotKey, to: SlotKey): Draft["slots"] {
  if (from === to) return slots;
  const next = { ...slots };
  const moving = next[from]?.photo;
  if (!moving) return slots;
  delete next[from];
  const target = next[to];
  if (target && isDeclared(target) && target.status !== "not-present") {
    next[to] = { ...target, photo: moving };
    return next;
  }
  if (target?.photo) {
    const other = freeOther(next);
    if (other) next[other] = { status: "uploaded", photo: target.photo };
  }
  next[to] = { status: "uploaded", photo: moving };
  return next;
}

/** Adds photos to the first free slots, as KitLegit's review upload zone does. Returns how many were skipped. */
export function fillFree(slots: Draft["slots"], photos: Photo[]): { slots: Draft["slots"]; skipped: number } {
  const next = { ...slots };
  let skipped = 0;
  for (const p of photos) {
    const free = ALL_SLOTS.find((k) => !next[k]);
    if (free) next[free] = { status: "uploaded", photo: p };
    else skipped++;
  }
  return { slots: next, skipped };
}

export const remainingSlots = (slots: Draft["slots"]) =>
  Math.min(MAX_PHOTOS, ALL_SLOTS.length) - ALL_SLOTS.filter((k) => slots[k]).length;

export type SlotMap = Partial<Record<SlotKey, SlotState>>;
