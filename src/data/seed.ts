import { buyerFee, CARRIERS } from "../lib/pricing";
import { newEntry } from "../lib/wallet";
import type { Listing, LockerState, User } from "../lib/types";

const daysAgo = (d: number, h = 0) => new Date(Date.now() - (d * 24 + h) * 3600_000).toISOString();

const USERS: User[] = [
  { id: "u-sam", email: "sam.carter@example.com", name: "Sam Carter", clubId: "harbour-city", city: "Bristol", rating: 4.9, sales: 12 },
  { id: "u-jordan", email: "jordan.ellis@example.com", name: "Jordan Ellis", clubId: "harbour-city", city: "Cardiff", rating: 5.0, sales: 0 },
  { id: "u-priya", email: "priya.shah@example.com", name: "Priya Shah", clubId: "harbour-city", city: "Leeds", rating: 4.8, sales: 31 },
  { id: "u-tom", email: "tom.whitaker@example.com", name: "Tom Whitaker", clubId: "northgate", city: "Newcastle", rating: 4.7, sales: 8 },
  { id: "u-lena", email: "lena.novak@example.com", name: "Lena Novak", clubId: "kingsmere", city: "Brighton", rating: 5.0, sales: 19 },
  { id: "u-marcus", email: "marcus.bell@example.com", name: "Marcus Bell", clubId: "northgate", city: "Glasgow", rating: 4.6, sales: 4 },
];

type SeedListing = [string, Listing["clubId"], Listing["type"], string, Listing["size"], Listing["condition"], number, string, Partial<Listing>?];

const LISTINGS: SeedListing[] = [
  ["l-1001", "harbour-city", "Home", "2019/20", "M", "Excellent", 5641, "u-sam", { status: "sold" }],
  ["l-1002", "harbour-city", "Away", "2021/22", "L", "Average", 3210, "u-priya"],
  ["l-1003", "harbour-city", "Third", "2018/19", "S", "Excellent", 4210, "u-tom"],
  ["l-1004", "harbour-city", "Home", "1998/99", "XL", "Average", 9100, "u-lena", { description: "Original from the cup run season. Small mark on the hem." }],
  ["l-1005", "harbour-city", "Home", "2023/24", "M", "New with tags", 4800, "u-marcus", { printing: "REYES 9" }],
  ["l-1006", "harbour-city", "Goalkeeper", "2022/23", "L", "Excellent", 3500, "u-priya"],
  ["l-1007", "harbour-city", "Away", "2008/09", "M", "Excellent", 12500, "u-tom", { nfcTag: "FN-30871" }],
  ["l-1008", "harbour-city", "Away", "2022/23", "M", "Excellent", 4000, "u-sam"],
  ["l-2001", "northgate", "Home", "2022/23", "M", "Excellent", 4500, "u-lena"],
  ["l-2002", "northgate", "Away", "2020/21", "S", "Average", 3800, "u-marcus"],
  ["l-2003", "northgate", "Third", "2019/20", "L", "Excellent", 3300, "u-tom"],
  ["l-2004", "northgate", "Home", "1995/96", "L", "Average", 14000, "u-priya", { nfcTag: "FN-30112", printing: "MCALLISTER 10" }],
  ["l-3001", "kingsmere", "Home", "2023/24", "M", "New with tags", 5200, "u-tom"],
  ["l-3002", "kingsmere", "Away", "2017/18", "XL", "Poor", 2900, "u-lena"],
  ["l-3003", "kingsmere", "Third", "2021/22", "S", "Excellent", 3600, "u-marcus"],
  // Non-partner clubs: The Locker app only, no club store, no club credit.
  ["l-4001", "eastbridge", "Home", "2004/05", "L", "Average", 6200, "u-priya"],
  ["l-4002", "millbrook", "Away", "2019/20", "M", "Excellent", 2800, "u-marcus"],
  ["l-1009", "millbrook", "Home", "2016/17", "M", "Excellent", 2800, "u-sam", { status: "sold" }],
  ["l-1010", "northgate", "Away", "2021/22", "M", "Excellent", 3400, "u-sam", { status: "sold" }],
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

  // Sam's Home 2019/20 sold in the Harbour City store and completed yesterday: the money has just landed in Sam's
  // wallet, and the PDF's "Sold! £56.41" choice is waiting.
  const sold = listings[0];
  const fee = buyerFee(sold.price);
  const postage = CARRIERS.inpost.price;
  // An older sale (a non-partner club's shirt, so no club credit): in the wallet for 63 days, 27 left before it
  // moves to Sam's bank automatically.
  const older = listings.find((l) => l.id === "l-1009")!;
  const olderFee = buyerFee(older.price);
  // And a Northgate shirt three weeks ago: Sam's wallet holds money from three sales and two partner clubs.
  const rovers = listings.find((l) => l.id === "l-1010")!;
  const roversFee = buyerFee(rovers.price);

  return {
    meId: "u-sam",
    storeUserId: null,
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
        status: "completed",
        events: [
          { status: "paid", at: daysAgo(4) },
          { status: "dispatched", at: daysAgo(3, 20) },
          { status: "in_transit", at: daysAgo(3, 10) },
          { status: "delivered", at: daysAgo(3, 2) },
          { status: "completed", at: daysAgo(1, 2) },
        ],
        tracking: "IP 6620 4417 0921",
        createdAt: daysAgo(4),
      },
      {
        id: "LK-19870",
        listingId: older.id,
        buyerId: "u-priya",
        sellerId: "u-sam",
        channel: "app",
        itemPrice: older.price,
        fee: olderFee,
        postage: CARRIERS.evri.price,
        total: older.price + olderFee + CARRIERS.evri.price,
        paymentMethod: "card",
        carrier: "evri",
        dropOff: "Evri ParcelShop · Costcutter, Mill Lane",
        status: "completed",
        events: [
          { status: "paid", at: daysAgo(70) },
          { status: "dispatched", at: daysAgo(69) },
          { status: "in_transit", at: daysAgo(68) },
          { status: "delivered", at: daysAgo(66) },
          { status: "completed", at: daysAgo(63) },
        ],
        tracking: "EV 2291 0473 5518",
        createdAt: daysAgo(70),
      },
      {
        id: "LK-20102",
        listingId: rovers.id,
        buyerId: "u-marcus",
        sellerId: "u-sam",
        channel: "club",
        clubId: "northgate",
        itemPrice: rovers.price,
        fee: roversFee,
        postage: CARRIERS.inpost.price,
        total: rovers.price + roversFee + CARRIERS.inpost.price,
        paymentMethod: "pay_by_bank",
        carrier: "inpost",
        dropOff: "InPost Locker · Tesco Extra, Harbour Rd",
        status: "completed",
        events: [
          { status: "paid", at: daysAgo(27) },
          { status: "dispatched", at: daysAgo(26) },
          { status: "in_transit", at: daysAgo(25, 12) },
          { status: "delivered", at: daysAgo(23) },
          { status: "completed", at: daysAgo(21) },
        ],
        tracking: "IP 7713 0286 4490",
        createdAt: daysAgo(27),
      },
    ],
    drafts: [],
    wallet: [
      newEntry("u-sam", "LK-20417", sold.price, new Date(daysAgo(1, 2)), "harbour-city"),
      { ...newEntry("u-sam", "LK-20102", rovers.price, new Date(daysAgo(21)), "northgate"), reviewed: true },
      { ...newEntry("u-sam", "LK-19870", older.price, new Date(daysAgo(63))), reviewed: true },
    ],
    walletMoves: [],
    credits: [],
    demo: { nextVerdict: "authentic", unsureId: false },
  };
}
