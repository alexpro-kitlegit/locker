import type { Club, SlotId, SlotStatus } from "../lib/types";

// KitLegit's photo slots and guidance, as used in its check flow (kitlegit-web UploadStep / checkTypes).
export const SLOTS: { id: SlotId; label: string; where: string }[] = [
  { id: "front", label: "Front of shirt", where: "Lay it flat, the whole shirt in frame." },
  { id: "back", label: "Back of shirt", where: "Lay it flat, the whole shirt in frame." },
  { id: "neck-label", label: "Neck label", where: "Inside the collar at the back of the neck." },
  { id: "wash-label", label: "Wash label", where: "Inside left seam. Care symbols and fabric content." },
  { id: "style-code", label: "Style code label", where: "Small label near the wash label with the product code." },
  { id: "security-label", label: "Security label", where: "Inside, near the hem or side seam." },
  { id: "hologram", label: "Hologram", where: "A small shiny sticker on the shirt, tag or packaging." },
  { id: "swing-tag", label: "Swing tag", where: "Attached with a plastic pin, if it's still on." },
  { id: "other", label: "Anything else", where: "Badges, sponsor print, damage worth showing." },
];

export const SLOT_LABEL = Object.fromEntries(SLOTS.map((s) => [s.id, s.label])) as Record<SlotId, string>;

/** KitLegit's reasons for a missing photo (MissingPhotosModal). */
export const MISSING_REASONS: { status: Exclude<SlotStatus, "uploaded">; label: string }[] = [
  { status: "not-present", label: "It never had one" },
  { status: "removed", label: "It's been removed" },
  { status: "damaged", label: "It's damaged or unreadable" },
];

// Stand-in for KitLegit's brand_requirements table. The default is front, back and wash label,
// and each brand adds its own labels. Values here are placeholders, not KitLegit's real rules.
const BRAND_EXTRAS: Record<string, SlotId[]> = {
  adidas: ["neck-label", "style-code"],
  Nike: ["neck-label", "style-code", "security-label"],
  Puma: ["neck-label", "style-code"],
  Umbro: ["neck-label"],
  Hummel: ["neck-label"],
};

export function mandatorySlots(club: Club, season: string): SlotId[] {
  const base: SlotId[] = ["front", "back", "wash-label"];
  const extras = BRAND_EXTRAS[club.brand] ?? [];
  // Older shirts didn't have separate security labels.
  const year = Number(season.slice(0, 4));
  return [...base, ...extras.filter((s) => !(s === "security-label" && year < 2010))];
}
