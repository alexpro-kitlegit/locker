import { buyerFee, CARRIERS } from "../lib/pricing";
import type { Listing, LockerState, User } from "../lib/types";

const daysAgo = (d: number, h = 0) => new Date(Date.now() - (d * 24 + h) * 3600_000).toISOString();

const USERS: User[] = [
  { id: "u-sam", name: "Sam Carter", clubId: "harbour-city", city: "Bristol", rating: 4.9, sales: 12 },
  { id: "u-jordan", name: "Jordan Ellis", clubId: "harbour-city", city: "Cardiff", rating: 5.0, sales: 0 },
  { id: "u-priya", name: "Priya Shah", clubId: "harbour-city", city: "Leeds", rating: 4.8, sales: 31 },
  { id: "u-tom", name: "Tom Whitaker", clubId: "northgate", city: "Newcastle", rating: 4.7, sales: 8 },
  { id: "u-lena", name: "Lena Novak", clubId: "kingsmere", city: "Brighton", rating: 5.0, sales: 19 },
  { id: "u-marcus", name: "Marcus Bell", clubId: "northgate", city: "Glasgow", rating: 4.6, sales: 4 },
];

type SeedListing = [string, Listing["clubId"], Listing["type"], string, Listing["size"], Listing["condition"], number, string, Partial<Listing>?];

const LISTINGS: SeedListing[] = [
  ["l-1001", "harbour-city", "Home", "2019/20", "M", "Excellent", 5641, "u-sam", { status: "sold" }],
  ["l-1002", "harbour-city", "Away", "2021/22", "L", "Good", 3210, "u-priya"],
  ["l-1003", "harbour-city", "Third", "2018/19", "S", "Excellent", 4210, "u-tom"],
  ["l-1004", "harbour-city", "Home", "1998/99", "XL", "Good", 9100, "u-lena", { description: "Original from the cup run season. Small mark on the hem." }],
  ["l-1005", "harbour-city", "Home", "2023/24", "M", "Brand new", 4800, "u-marcus", { printing: "REYES 9" }],
  ["l-1006", "harbour-city", "Goalkeeper", "2022/23", "L", "Excellent", 3500, "u-priya"],
  ["l-1007", "harbour-city", "Away", "2008/09", "M", "Excellent", 12500, "u-tom", { nfcTag: "FN-30871" }],
  ["l-1008", "harbour-city", "Away", "2022/23", "M", "Excellent", 4000, "u-sam"],
  ["l-2001", "northgate", "Home", "2022/23", "M", "Excellent", 4500, "u-lena"],
  ["l-2002", "northgate", "Away", "2020/21", "S", "Good", 3800, "u-marcus"],
  ["l-2003", "northgate", "Third", "2019/20", "L", "Excellent", 3300, "u-tom"],
  ["l-2004", "northgate", "Home", "1995/96", "L", "Good", 14000, "u-priya", { nfcTag: "FN-30112", printing: "MCALLISTER 10" }],
  ["l-3001", "kingsmere", "Home", "2023/24", "M", "Brand new", 5200, "u-tom"],
  ["l-3002", "kingsmere", "Away", "2017/18", "XL", "Fair", 2900, "u-lena"],
  ["l-3003", "kingsmere", "Third", "2021/22", "S", "Excellent", 3600, "u-marcus"],
];

export function seedState(): LockerState {
  const listings: Listing[] = LISTINGS.map(([id, clubId, type, season, size, condition, price, sellerId, extra], i) => {
    const checkNo = id === "l-1001" ? "48213" : String(48100 + i * 7);
    return {
      id,
      clubId,
      type,
      season,
      size,
      condition,
      price,
      sellerId,
      status: "live",
      createdAt: daysAgo(14 - i, i),
      check: { id: `KL-${checkNo}`, verdict: "authentic", certificate: `KL-${checkNo}`, labels: "6 of 6", checkedAt: daysAgo(14 - i, i) },
      ...extra,
    };
  });

  // Sam's Home 2019/20 sold in the Harbour City store and has been delivered: the PDF's "Sold! £56.41 is yours" screen.
  const sold = listings[0];
  const fee = buyerFee(sold.price);
  const postage = CARRIERS.inpost.price;

  return {
    meId: "u-sam",
    storeBuyerId: "u-jordan",
    users: Object.fromEntries(USERS.map((u) => [u.id, u])),
    listings,
    orders: [
      {
        id: "LK-20417",
        listingId: sold.id,
        buyerId: "u-jordan",
        sellerId: "u-sam",
        channel: "club",
        clubId: "harbour-city",
        itemPrice: sold.price,
        fee,
        postage,
        total: sold.price + fee + postage,
        paymentMethod: "pay_by_bank",
        carrier: "inpost",
        dropOff: "InPost Locker · Tesco Extra, Harbour Rd",
        status: "delivered",
        events: [
          { status: "paid", at: daysAgo(4) },
          { status: "dispatched", at: daysAgo(3, 20) },
          { status: "in_transit", at: daysAgo(3) },
          { status: "delivered", at: daysAgo(1, 2) },
        ],
        dispatchCheckId: "KL-48390",
        tracking: "IP 6620 4417 0921",
        createdAt: daysAgo(4),
      },
    ],
    lockerBalance: 0,
    credits: [],
    demo: { nextVerdict: "authentic" },
  };
}
