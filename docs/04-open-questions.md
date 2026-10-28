# Open questions

## Business (from the founders' draft, "to decide")

- Price per KitLegit check (cost assumed at 14p).
- Customer data: who owns it — The Locker, the club, or KitLegit?
- Shared or separate team.
- Legal set-up.
- Suppliers (see [integrations](02-integrations.md)).

## Product

- **Supabase:** does The Locker share KitLegit's project or get its own? This decides data ownership.
- **Dispatch check:** the cost model assumes a KitLegit check at dispatch. Who does it, and how? Does the seller re-photograph the shirt and get matched to the listing check?
- **Buy-only club stores:** can fans sell from a club store, or only from The Locker app? (The PDF says only from the app.)
- **Which club stores a listing shows in:** the seller's club only, the shirt's club, or all relevant clubs? A Home 2019/20 Yourclub shirt probably shows in the Yourclub store.
- **Fee breakdown:** what is in the all-in price shown to the buyer?
- **Club templates:** how many, and how much can a club customise (colours, logo, hero, layout)?
- **Embedding:** subdomain on the club's site vs a webview inside the club's app. Is there auth handoff from the club's account system?
- **Account linking:** if a fan buys on a club store, are they a Locker account holder?
- **Club credit for clubs without Shopify:** codes from the club or our own credit shop.
- **When an NFC tag is required:** what counts as "high value"?
- **Counterfeit at listing:** what does the seller see? Does it go to Back Four automatically?

## Assumptions made in the prototype (please confirm or correct)

1. **Buyer fee = 5% + 70p.** Worked out from the PDF's screens (£56.41 shows as £59.93). The money slide implies roughly £3.94 a sale on a £30 shirt, which doesn't match. Which is right?
2. **Club credit goes to the seller's own club**, not the shirt's club.
3. **The payout is chosen after delivery**, on the "Sold!" screen. Workaround 2 in the PDF says "at the moment of sale". Should the seller pre-pick it when the shirt sells?
4. **Dispatch check = 2 photos** (front + wash label), matched by KitLegit to the listing check. Is that technically possible today, and is it the 14p check the cost model assumes?
5. **Club store buyers sign in with a Locker account.** Is guest checkout allowed?
6. **When the money is released:** on the carrier's "delivered" scan, or after a buyer window (Vinted gives 2 days)?
7. **Counterfeit result:** the check is free for the seller, the result goes to Back Four, and the seller can ask for a KitLegit manual review. What are the legal basis and consent for sharing with Back Four? Who pays for the manual review?
8. **Sold shirts stay visible** in club stores as social proof.
9. **Seller ships within 3 days**, otherwise the order is cancelled and the buyer refunded. The number is a placeholder.
10. **FanNFC tags are free** and posted to the seller for shirts at £100 or more. Who pays for them, and what is the threshold?
