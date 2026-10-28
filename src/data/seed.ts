import { buyerFee, CARRIERS } from "../lib/pricing";
import { newEntry } from "../lib/wallet";
import type { Listing, LockerState, SellerProfile, User } from "../lib/types";

const daysAgo = (d: number, h = 0) => new Date(Date.now() - (d * 24 + h) * 3600_000).toISOString();

const verified = (extra: Partial<SellerProfile> = {}): SellerProfile => ({
  status: "verified",
  type: "private",
  bankLast4: "4417",
  termsAcceptedAt: daysAgo(400),
  bundleDiscount: 0,
  failedStreak: 0,
  taxYear: { sales: 8, earnings: 31000 },
  ...extra,
});

const USERS: User[] = [
  {
    id: "u-sam",
    email: "sam.carter@example.com",
    name: "Sam Carter",
    clubId: "harbour-city",
    city: "Bristol",
    sales: 12,
    joinedAt: daysAgo(420),
    // Close to HMRC's limit of 30 sales, to show the warning.
    seller: verified({
      dob: "1991-04-12",
      address: { line1: "14 Alder Close", city: "Bristol", postcode: "BS3 4QR" },
      taxId: "QQ •• •• •• C",
      bundleDiscount: 10,
      fastDispatch: true,
      taxYear: { sales: 23, earnings: 104000 },
    }),
    // Sam uses the KitLegit app but hasn't connected it to The Locker yet.
    kitlegit: { username: "samcarter_kits" },
  },
  // Jordan has never sold: starting to sell goes through seller onboarding.
  { id: "u-jordan", email: "jordan.ellis@example.com", name: "Jordan Ellis", clubId: "harbour-city", city: "Cardiff", sales: 0, joinedAt: daysAgo(30), seller: { status: "none", bundleDiscount: 0, failedStreak: 0, taxYear: { sales: 0, earnings: 0 } } },
  { id: "u-priya", email: "priya.shah@example.com", name: "Priya Shah", clubId: "harbour-city", city: "Leeds", sales: 31, joinedAt: daysAgo(700), seller: verified({ type: "business", businessName: "Priya's Retro Kits", fastDispatch: true, bundleDiscount: 15 }) },
  { id: "u-tom", email: "tom.whitaker@example.com", name: "Tom Whitaker", clubId: "northgate", city: "Newcastle", sales: 8, joinedAt: daysAgo(200), seller: verified() },
  { id: "u-lena", email: "lena.novak@example.com", name: "Lena Novak", clubId: "kingsmere", city: "Brighton", sales: 19, joinedAt: daysAgo(500), seller: verified({ fastDispatch: true }) },
  { id: "u-marcus", email: "marcus.bell@example.com", name: "Marcus Bell", clubId: "northgate", city: "Glasgow", sales: 4, joinedAt: daysAgo(90), seller: verified() },
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
  ["l-3002", "kingsmere", "Away", "2017/18", "XL", "Poor", 2900, "u-lena", { status: "sold" }],
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
      {
        // Sam bought this from Lena. Re-listing it means a new check.
        id: "LK-18800",
        listingId: "l-3002",
        buyerId: "u-sam",
        sellerId: "u-lena",
        channel: "club",
        clubId: "kingsmere",
        itemPrice: 2900,
        fee: buyerFee(2900),
        postage: CARRIERS.evri.price,
        total: 2900 + buyerFee(2900) + CARRIERS.evri.price,
        paymentMethod: "card",
        carrier: "evri",
        dropOff: "Home delivery · 14 Alder Close",
        status: "completed",
        events: [
          { status: "paid", at: daysAgo(48) },
          { status: "dispatched", at: daysAgo(47) },
          { status: "in_transit", at: daysAgo(46) },
          { status: "delivered", at: daysAgo(44) },
          { status: "completed", at: daysAgo(42) },
        ],
        tracking: "EV 4410 8823 1190",
        createdAt: daysAgo(48),
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
    kitlegit: [
      // Checks Sam did in the KitLegit app. Authentic ones can be listed straight away.
      { id: "kl-1", userId: "u-sam", certificate: "KL-51022", clubId: "kingsmere", type: "Home", season: "2023/24", condition: "Excellent", verdict: "authentic", checkedAt: daysAgo(40) },
      { id: "kl-2", userId: "u-sam", certificate: "KL-50317", clubId: "harbour-city", type: "Third", season: "2020/21", condition: "New with tags", verdict: "authentic", checkedAt: daysAgo(95) },
      { id: "kl-3", userId: "u-sam", certificate: "KL-49880", clubId: "northgate", type: "Home", season: "2019/20", condition: "Average", verdict: "counterfeit", checkedAt: daysAgo(150) },
    ],
    reviews: [
      { id: "r-1", orderId: "LK-19870", from: "u-priya", to: "u-sam", stars: 5, text: "Exactly as described and sent the next day. Thanks!", at: daysAgo(63) },
      { id: "r-2", orderId: "LK-20102", from: "u-marcus", to: "u-sam", stars: 5, text: "Great shirt, well packed.", at: daysAgo(21) },
      { id: "r-3", orderId: "old-1", from: "u-tom", to: "u-sam", stars: 4, text: "Good seller, a day slower than I hoped.", at: daysAgo(120) },
      { id: "r-4", orderId: "LK-18800", from: "u-sam", to: "u-lena", stars: 5, text: "Lovely retro shirt, quick delivery.", at: daysAgo(40) },
      { id: "r-5", orderId: "old-2", from: "u-jordan", to: "u-priya", stars: 5, text: "Brilliant, would buy again.", at: daysAgo(10) },
      { id: "r-6", orderId: "old-3", from: "u-tom", to: "u-priya", stars: 5, text: "Perfect condition.", at: daysAgo(30) },
      { id: "r-7", orderId: "old-4", from: "u-marcus", to: "u-priya", stars: 4, text: "Good, small mark not mentioned.", at: daysAgo(50) },
      { id: "r-8", orderId: "old-5", from: "u-priya", to: "u-lena", stars: 5, text: "Spot on.", at: daysAgo(80) },
      { id: "r-9", orderId: "old-6", from: "u-sam", to: "u-tom", stars: 4, text: "All good.", at: daysAgo(70) },
    ],
    conversations: [
      // Jordan has made an offer on Sam's Away 2022/23: Sam can accept, decline or counter.
      {
        id: "c-1",
        listingId: "l-1008",
        buyerId: "u-jordan",
        sellerId: "u-sam",
        messages: [
          { id: "m-1", from: "u-jordan", at: daysAgo(0, 5), kind: "text", text: "Hi! Is it the player or the stadium version?" },
          { id: "m-2", from: "u-sam", at: daysAgo(0, 4), kind: "text", text: "Stadium version. Worn twice, no marks." },
          { id: "m-3", from: "u-jordan", at: daysAgo(0, 1), kind: "offer", amount: 3400 },
        ],
        offer: { amount: 3400, by: "u-jordan", status: "pending", expiresAt: new Date(Date.now() + 47 * 3600_000).toISOString() },
        updatedAt: daysAgo(0, 1),
      },
    ],
    notifications: [
      { id: "n-1", userId: "u-sam", kind: "offer", title: "Jordan offered £34.00", body: "For your Away 2022/23. Accept, decline or counter.", link: { to: "conversation", id: "c-1" }, at: daysAgo(0, 1), read: false },
      { id: "n-2", userId: "u-sam", kind: "money_in", title: "£56.41 is in your wallet", body: "Your Home 2019/20 sale is complete.", link: { to: "payout", id: "LK-20417" }, at: daysAgo(1, 2), read: false },
      { id: "n-3", userId: "u-sam", kind: "tax", title: "You're close to HMRC's reporting limit", body: "23 sales this year. We report sellers with 30+ sales or about £1,700 a year.", link: { to: "wallet" }, at: daysAgo(2), read: true },
      { id: "n-4", userId: "u-sam", kind: "review", title: "Marcus left you 5 stars", body: "\u201cGreat shirt, well packed.\u201d", link: { to: "profile" }, at: daysAgo(21), read: true },
    ],
    demo: { nextVerdict: "authentic", unsureId: false, expertVerdict: "authentic" },
  };
}
