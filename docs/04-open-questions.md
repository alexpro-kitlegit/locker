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
- ~~**Buy-only club stores**~~ **Decided:** fans can sell from a club store too. Photos are uploaded on the web, or taken on the phone via App Clip / app.
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
2. ~~Club credit goes to the seller's own club.~~ **Decided:** credit is at the shirt's club if it's a partner. Otherwise Locker balance or cash.
3. **The payout is chosen after delivery**, on the "Sold!" screen. Workaround 2 in the PDF says "at the moment of sale". Should the seller pre-pick it when the shirt sells?
4. ~~Dispatch check on the seller side~~ **Decided:** not a seller step. It moves to the buyer side, to be designed later.
5. ~~Accounts~~ **Proposed:** one Locker account, linked to the club's Shopify or SSO account where possible (see [accounts](06-accounts.md)). Is guest checkout still allowed for buyers?
6. ~~When the money is released~~ **Decided:** 48 hours after delivery, unless the buyer reports a problem.
7. **Counterfeit result:** the check is free for the seller, the result goes to Back Four, and the seller can ask for a KitLegit manual review. What are the legal basis and consent for sharing with Back Four? Who pays for the manual review?
8. **Sold shirts stay visible** in club stores as social proof.
9. **Seller ships within 3 days**, otherwise the order is cancelled and the buyer refunded. The number is a placeholder.
10. **FanNFC tags are free** and posted to the seller for shirts at £100 or more. Who pays for them, and what is the threshold?

## From the seller flow (v0.2)

11. **A club store's own shirts only?** Sam listed a Northgate shirt from the Harbour City store. It shows in the app and the Northgate store, but not in the Harbour City store. Is that right?
12. **"Powered by KitLegit" in the app header.** The seller flow no longer mentions KitLegit, but the app header still shows the badge, and buyers see "Checked by KitLegit". Keep both?
13. **Removed labels:** KitLegit asks for evidence when a label has been removed. Do we ask for it in the listing flow, or only if the background check needs it?
14. **Rejected listings:** what does the seller see later (email, app notification)? Is the "second look" a KitLegit manual review, and who pays for it?
15. **Valuation:** is there enough KitLegit price data per shirt at launch? What's the fallback when there are few sales?
16. **Drafts:** how long do unfinished listings and their photos stay?
17. **Background check time:** the prototype takes about 8 seconds. What's the real target, and do we email or push when it's live?

## Key decision points (raise before the flowchart is final)

- ★ **Locker balance and club credit as e-money.** Stripe's 90-day payout limit and the e-money rules. Being looked into.
- **Messages:** free-text questions with guardrails, or offers plus structured questions only (see [seller journey](07-seller-journey.md#recommendation-on-messages)).

## From the wallet (v0.4)

18. **Fee on the automatic 90-day transfer.** Free, or the usual 5% + 50p bank fee? The prototype only shows the date.
19. **Club credit from the wallet:** only the shirt's club (current, as decided earlier), or let sellers put any of it into one partner club (e.g. their favourite)? Simpler for fans, but the club whose shirt sold doesn't get the credit.
20. **Minimum amount** for a bank withdrawal or credit swap?
