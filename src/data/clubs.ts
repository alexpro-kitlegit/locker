import type { AccountMethod, Club, TemplateId } from "../lib/types";

// Fictional clubs. The three partners each use a different store template and sign-in set-up,
// to show the white-label range. The non-partners have no store and no club credit.
export const CLUBS: Club[] = [
  {
    id: "harbour-city",
    name: "Harbour City FC",
    initials: "HC",
    partner: true,
    brand: "adidas",
    domain: "locker.harbourcityfc.com",
    shopDomain: "shop.harbourcityfc.com",
    primary: "#8B1E2D",
    secondary: "#F2C14E",
    onPrimary: "#FFFFFF",
    template: "classic",
    creditMethod: "shopify",
    accountMethod: "shopify",
    accountName: "Harbour City FC account",
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
    partner: true,
    brand: "Nike",
    domain: "locker.northgaterovers.co.uk",
    shopDomain: "store.northgaterovers.co.uk",
    primary: "#13294B",
    secondary: "#E8B53A",
    onPrimary: "#FFFFFF",
    template: "bold",
    creditMethod: "codes",
    accountMethod: "club_sso",
    accountName: "Rovers ID",
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
    partner: true,
    brand: "Puma",
    domain: "locker.kingsmereathletic.com",
    shopDomain: "kingsmereathletic.com/shop",
    primary: "#1E6B3A",
    secondary: "#FFFFFF",
    onPrimary: "#FFFFFF",
    template: "minimal",
    creditMethod: "own_shop",
    accountMethod: "locker",
    kits: {
      Home: { body: "#1E6B3A", trim: "#FFFFFF", pattern: "hoops", patternColor: "#FFFFFF" },
      Away: { body: "#FFFFFF", trim: "#1E6B3A", pattern: "plain" },
      Third: { body: "#E86A2A", trim: "#1E1E1E", pattern: "plain" },
      Goalkeeper: { body: "#F5D90A", trim: "#111111", pattern: "plain" },
    },
  },
  {
    id: "eastbridge",
    name: "Eastbridge United",
    initials: "EU",
    partner: false,
    brand: "Umbro",
    primary: "#C8102E",
    secondary: "#FFFFFF",
    onPrimary: "#FFFFFF",
    kits: {
      Home: { body: "#C8102E", trim: "#FFFFFF", pattern: "plain" },
      Away: { body: "#FFFFFF", trim: "#C8102E", pattern: "halves", patternColor: "#F1F1F1" },
      Third: { body: "#0B0B0B", trim: "#C8102E", pattern: "plain" },
      Goalkeeper: { body: "#00A3AD", trim: "#111111", pattern: "plain" },
    },
  },
  {
    id: "millbrook",
    name: "Millbrook Town",
    initials: "MT",
    partner: false,
    brand: "Hummel",
    primary: "#F2A900",
    secondary: "#111111",
    onPrimary: "#111111",
    kits: {
      Home: { body: "#F2A900", trim: "#111111", pattern: "stripes", patternColor: "#111111" },
      Away: { body: "#111111", trim: "#F2A900", pattern: "plain" },
      Third: { body: "#FFFFFF", trim: "#F2A900", pattern: "plain" },
      Goalkeeper: { body: "#4A7BD0", trim: "#111111", pattern: "plain" },
    },
  },
];

export const PARTNER_CLUBS = CLUBS.filter((c) => c.partner);

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

export const ACCOUNT_METHOD_NAMES: Record<AccountMethod, string> = {
  shopify: "Shopify customer account, linked",
  club_sso: "Club login (SSO), linked",
  locker: "Locker account only",
};

export function getClub(id: string | undefined): Club | undefined {
  return CLUBS.find((c) => c.id === id);
}
