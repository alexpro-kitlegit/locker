import type { Club, TemplateId } from "../lib/types";

// Fictional clubs, each on a different store template, to show the white-label range.
export const CLUBS: Club[] = [
  {
    id: "harbour-city",
    name: "Harbour City FC",
    initials: "HC",
    domain: "locker.harbourcityfc.com",
    shopDomain: "shop.harbourcityfc.com",
    primary: "#8B1E2D",
    secondary: "#F2C14E",
    onPrimary: "#FFFFFF",
    template: "classic",
    creditMethod: "shopify",
    kits: {
      Home: { body: "#8B1E2D", trim: "#F2C14E", pattern: "plain" },
      Away: { body: "#F4F1EA", trim: "#8B1E2D", pattern: "sash", patternColor: "#8B1E2D" },
      Third: { body: "#1C1C1C", trim: "#F2C14E", pattern: "plain" },
      Goalkeeper: { body: "#2F8F5B", trim: "#111111", pattern: "plain" },
    },
  },
  {
    id: "northgate",
    name: "Northgate Rovers",
    initials: "NR",
    domain: "locker.northgaterovers.co.uk",
    shopDomain: "store.northgaterovers.co.uk",
    primary: "#13294B",
    secondary: "#E8B53A",
    onPrimary: "#FFFFFF",
    template: "bold",
    creditMethod: "codes",
    kits: {
      Home: { body: "#13294B", trim: "#FFFFFF", pattern: "stripes", patternColor: "#E8B53A" },
      Away: { body: "#E8B53A", trim: "#13294B", pattern: "plain" },
      Third: { body: "#7FA7D9", trim: "#13294B", pattern: "halves", patternColor: "#13294B" },
      Goalkeeper: { body: "#6B2FA3", trim: "#FFFFFF", pattern: "plain" },
    },
  },
  {
    id: "kingsmere",
    name: "Kingsmere Athletic",
    initials: "KA",
    domain: "locker.kingsmereathletic.com",
    shopDomain: "kingsmereathletic.com/shop",
    primary: "#1E6B3A",
    secondary: "#FFFFFF",
    onPrimary: "#FFFFFF",
    template: "minimal",
    creditMethod: "own_shop",
    kits: {
      Home: { body: "#1E6B3A", trim: "#FFFFFF", pattern: "hoops", patternColor: "#FFFFFF" },
      Away: { body: "#FFFFFF", trim: "#1E6B3A", pattern: "plain" },
      Third: { body: "#E86A2A", trim: "#1E1E1E", pattern: "plain" },
      Goalkeeper: { body: "#F5D90A", trim: "#111111", pattern: "plain" },
    },
  },
];

export const TEMPLATE_NAMES: Record<TemplateId, string> = {
  classic: "Classic",
  bold: "Bold",
  minimal: "Minimal",
};

export const CREDIT_METHOD_NAMES = {
  shopify: "Shopify gift cards",
  codes: "Codes from the club",
  own_shop: "Locker credit shop",
} as const;

export function getClub(id: string | undefined): Club | undefined {
  return CLUBS.find((c) => c.id === id);
}
