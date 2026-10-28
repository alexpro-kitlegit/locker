import type { ListingStatus } from "./types";

export const LISTING_STATUS: Record<ListingStatus, { label: string; tone: string }> = {
  in_review: { label: "Getting ready", tone: "bg-amber-50 text-amber-700" },
  live: { label: "Live", tone: "bg-green-50 text-green-700" },
  rejected: { label: "Couldn't list", tone: "bg-red-50 text-red-700" },
  expert_review: { label: "Expert checking", tone: "bg-amber-50 text-amber-700" },
  sold: { label: "Sold", tone: "bg-neutral-100 text-neutral-600" },
  withdrawn: { label: "Withdrawn", tone: "bg-neutral-100 text-neutral-600" },
};
