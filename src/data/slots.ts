import type { NamedSlot, SlotKey, SlotState } from "../lib/types";

// KitLegit's photo slots and guide text (kitlegit-web PhotoGuideDrawer / lib/helpImages).
export const NAMED_SLOTS: { id: NamedSlot; label: string; description: string; where: string }[] = [
  {
    id: "front",
    label: "Front of Shirt",
    description: "A clear, flat photo of the entire front of the shirt including all logos, badges, and sponsor text.",
    where: "Lay the shirt flat on a clean surface with the front facing up. Ensure the full shirt fits in frame.",
  },
  {
    id: "back",
    label: "Back of Shirt",
    description: "A clear, flat photo of the entire back of the shirt including any player name and number.",
    where: "Turn the shirt over and lay flat. Straighten the collar and hem before shooting.",
  },
  {
    id: "neck-label",
    label: "Neck Label",
    description: "Close-up of the label inside the neck/collar area showing brand logo and size.",
    where: "Inside the back of the collar, where it meets the shirt.",
  },
  {
    id: "wash-label",
    label: "Wash Label",
    description: "Close-up of the care/wash label showing material composition and washing instructions.",
    where: "Usually found on the inside left seam, near the bottom hem.",
  },
  {
    id: "style-code",
    label: "Style Code Label",
    description: "Close-up of the label showing the product/style code (e.g. IQ0893).",
    where: "Often on the same label as the wash instructions, or on a separate tag nearby.",
  },
  {
    id: "security-label",
    label: "Security Label",
    description: "Close-up of any hologram, QR code, or security tag on the garment.",
    where: "Check the inside neck area, hem labels, or hang tags for holographic elements.",
  },
  {
    id: "hologram",
    label: "Holograms",
    description: "A close-up photo of the hologram sticker showing the full iridescent surface.",
    where: "Usually found on the swing tag, inside the collar, or on the care label.",
  },
  {
    id: "swing-tag",
    label: "Swing Tag",
    description: "Photo of the paper swing tag/hang tag that was attached to the shirt at purchase.",
    where: "Usually attached to the collar or side label. May have been removed after purchase.",
  },
];

export const OTHER_SLOTS: SlotKey[] = ["other1", "other2", "other3", "other4"];
export const ALL_SLOTS: SlotKey[] = [...NAMED_SLOTS.map((s) => s.id), ...OTHER_SLOTS];

export const slotLabel = (key: SlotKey) => NAMED_SLOTS.find((s) => s.id === key)?.label ?? "Other Feature";
export const slotInfo = (key: SlotKey) => NAMED_SLOTS.find((s) => s.id === key);
export const isOther = (key: SlotKey) => key.startsWith("other");
/** Front, back and Other slots have simple links; label slots get KitLegit's Options menu. */
export const isLabelSlot = (key: SlotKey) => !isOther(key) && key !== "front" && key !== "back";

export const MAX_PHOTOS = 12;
export const MIN_PHOTOS = 3;

export const STATUS_TAG: Partial<Record<SlotState["status"], string>> = {
  blurry: "Blurry",
  dark: "Too Dark",
  damaged: "Damaged",
  unreadable: "Unreadable",
  removed: "Removed",
  "not-present": "Not present",
};

/** A slot the seller has explained (so an empty mandatory slot no longer blocks). */
export const isDeclared = (s?: SlotState) =>
  !!s && (s.status === "not-present" || s.status === "removed" || s.status === "damaged" || s.status === "unreadable");

// Stand-in for KitLegit's brand_requirements table. Default is front, back and wash label (as in KitLegit),
// and each brand adds its own labels. These extras are placeholders, not KitLegit's real rules.
const BRAND_EXTRAS: Record<string, NamedSlot[]> = {
  adidas: ["neck-label", "style-code", "security-label"],
  Nike: ["neck-label", "style-code", "security-label"],
  Puma: ["neck-label", "style-code"],
  Umbro: ["neck-label"],
  Hummel: ["neck-label"],
};

export function mandatorySlots(brand: string, season?: string): NamedSlot[] {
  const year = season ? Number(season.slice(0, 4)) : 2020;
  const extras = (BRAND_EXTRAS[brand] ?? []).filter((s) => !(s === "security-label" && year < 2010));
  return ["front", "back", "wash-label", ...extras];
}

export const BRANDS = ["adidas", "Nike", "Puma", "Umbro", "Hummel", "Kappa", "Macron", "New Balance", "Castore", "Le Coq Sportif"];
