# Screens (prototype v0.1: the core sale loop)

What's built so far, what each screen needs for real, and what it touches. Routes are prototype routes. In production, club stores are resolved from the domain, not the path.

## The Locker app (fans, not white-labelled)

| Screen | Route | What it does | Real integrations | Data |
|---|---|---|---|---|
| Home | `/app` | Sell CTA, shirts from your club, club stores, new in | — | listings, clubs, profiles |
| Search | `/app/search` | Filter by club, type, retro; text search | Postgres search | listings |
| **Sell: photos** | `/app/sell` | Photo slots (front, back, neck, wash, style code, swing tag) | KitLegit upload + `analyse-photos` | KitLegit check |
| **Sell: KitLegit check** | (same) | Progress, then Authentic or Counterfeit | KitLegit `submit-to-api` → `get-result` | checks, current_effective_results, certificates |
| Sell: counterfeit | (same) | Can't list. Free check. Shared with Back Four. Manual review option. | Back Four handoff; KitLegit admin review | counterfeit_reports |
| Sell: details | (same) | Size, condition, name and number. Club, type and season come from KitLegit. | — | listings |
| Sell: price | (same) | Price, all three payout amounts, buyer's all-in price, where it's shown, NFC notice | Price suggestions (sales data) | listings, nfc_tags |
| Sell: live | (same) | PDF "Authentic · Live in The Locker and the club store" screen | — | — |
| Listing | `/app/listing/:id` | Shirt, all-in price, KitLegit certificate, FanNFC tap, seller, buy | FanNFC tag verify | listings, certificates, nfc_tags |
| Checkout | `/app/checkout/:id` | Shared checkout (see below), plus Locker balance as a payment method | Stripe, ShipStation rates | orders |
| Order | `/app/orders/:id` | Buyer or seller view: tracking, send CTA, payout CTA, certificate transfer, message, report a problem | ShipStation tracking, Supabase Realtime chat, Help Scout | orders, shipments, disputes |
| **Dispatch** | `/app/orders/:id/dispatch` | Dispatch check (2 photos matched to the listing check), then the drop-off QR code | KitLegit (match), ShipStation (QR label) | orders, shipments, checks |
| **Payout** | `/app/payout/:id` | PDF "Sold! £x is yours": club credit 110% / Locker balance / bank, then a gift card code | Shopify gift cards or club codes; Stripe Connect payouts | payouts, club_credit_issuances, wallet_ledger |
| Wallet | `/app/wallet` | Locker balance, held money, ready to pay out, to send, on the way, club credit codes, history | Stripe Connect balances | payouts, wallet_ledger |
| Me | `/app/me` | Profile, your club, your listings, purchases, identity (Stripe), payout bank, notifications, help | Stripe Connect onboarding | profiles |

## Seller flow (v0.2, shared by the app and club stores)

| Step | What it does | Notes |
|---|---|---|
| 1. Photos | Drop or upload several photos at once (sorted into KitLegit slots), or tap a slot. In the app, the camera opens. | The club store also shows "Rather use your phone's camera?" with a QR code (App Clip / app). |
| 2. Check photos | "We think it's …" (editable), then the photos this brand needs (from brand_requirements). Missing ones: add, finish on the phone (QR), or "I don't have it" (never had one / removed / damaged). | Same rules as KitLegit's check flow. "Save and finish later" on the web. |
| 3. Details | Size, condition, version (stadium / player), name and number | |
| 4. Price | Estimated value (range, number of sales, "use £x"), price, payout options under the partner rule, where it's shown, NFC notice | |
| Submitted | "Getting your listing ready", then "It's live!" (or "We couldn't list this shirt") | The KitLegit check and certificate are never mentioned to the seller. |

Drafts appear on the app's Home and Sell tabs and in the club store account ("Unfinished listings").

## Club stores (white-label)

| Screen | Route | What it does | Real integrations | Data |
|---|---|---|---|---|
| Store home | `/store/:club` | Club-themed header, promises, filters, grid. Sold shirts stay visible. 3 templates: Classic, Bold, Minimal. | Cloudflare (domain → club), PostHog | clubs, listings |
| Item | `/store/:club/item/:id` | Shirt, all-in price, KitLegit certificate, NFC note, protections, seller | — | listings, certificates |
| Checkout | `/store/:club/checkout/:id` | Signed in with The Locker; delivery (InPost / Evri / Royal Mail); Pay by Bank first; summary | Stripe, ShipStation, Locker auth from a club site | orders |
| Order confirmation | `/store/:club/order/:id` | Thanks, live tracking, certificate transfers on delivery, get the app | ShipStation tracking | orders |
| Sign in | sheet | The club's own account (Shopify / SSO) linked to a Locker account, or email | Shopify Customer Account API, OIDC, Supabase Auth | users, account_links |
| Sell | `/store/:club/sell/:draft` | The shared seller flow, in club colours | see above | listing_drafts, listings |
| Account | `/store/:club/account` | Same Locker account: needs you, unfinished listings, listings for any club, wallet, purchases | — | everything per user |
| Payout | `/store/:club/payout/:order` | Shared payout chooser (partner rule) | Shopify gift cards, Stripe | payouts |

### Shared checkout

Item + buyer protection + postage = total. Pay by Bank comes first (cheapest, no chargebacks). The money is held until delivery.

## Prototype-only

| Screen | Route | Purpose |
|---|---|---|
| Hub | `/` | Links to every surface, the demo script, and prototype settings (next check result, reset) |
| Side-by-side demo | `/demo` | App in a phone and a club store in a browser frame, live-synced |
| Prototype controls | amber dashed boxes | Stand in for integrations: pick which shirt is in the photos, force a counterfeit, carrier scan/delivery, NFC tap |

## Not built yet

- **Club portal:** onboarding, template and colours, domain DNS, credit method, analytics (sales, credit issued, authentic vs counterfeit from KitLegit), monthly statements.
- **Locker ops admin:** disputes, flagged chats, payouts, clubs, KitLegit check costs.
- **Chat:** per-order messages with AI scam flags.
- **Full dispute flow:** evidence, decision, refund.
- **Sign-up and onboarding:** Locker account, picking your club, Stripe Connect identity for sellers.
- **Notifications:** email and push at each order step.
