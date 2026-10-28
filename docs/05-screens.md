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

## Seller flow (v0.3: KitLegit's check flow, ported almost 1:1)

Shared by the app and every club store (`src/components/sell/`). It reproduces kitlegit-web's `/check` flow step by step, against mocks. The real product should reuse KitLegit's components and edge functions directly. Differences from KitLegit are marked **Locker**.

| Step | As in KitLegit | Locker changes |
|---|---|---|
| Top bar | Numbered step circles, "← Back", primary button with →, exit leads to "Save your progress?" ("Save & Exit" / "Exit Without Saving") | A 4th circle for Price. Drafts also continue on the phone |
| Select (sport, item type) | — | **Dropped:** The Locker only sells football shirts |
| 1. Upload | Drop zone "Click or drop photos here", Min 3 · Max 12, 12-tile grid, Recommended Photos with "Find it ›", Example Photos. Narrow: "Add your photos" / "Choose Photos" / "Required Photos". KitLegit's photo checks (duplicate, not an image, >20MB, blank/dark, thumbnail, <400px) with its toast copy. CTA "Analyse Photos" | Phone hand-off card on the club store. Camera capture in the app. Blur detection not in the prototype |
| Processing | "Did you know..." football facts, stages Uploading photos → Analysing details → Preparing review, min 5s | No KitLegit branding |
| Season select (only when unsure) | Confirm team & brand → era → season, with "Not Sure"; Back from the first sub-step resets to Upload | — |
| 2. Review | Slot rows (mandatory first), 4 Other slots, style code / security hidden unless needed. Slot cards with Options menu (upload/replace, move, remove, where to find, damaged/unreadable, not originally present, removed), "Not Present or Removed?" modal, drag between slots (move-to-Other rule), "Move to another slot…" on narrow screens. Item Details + Photos checklist panel. "Add more photos". CTA "Review" → "Please fix the following" → "Confirm security code" | Hand-off card when required photos are missing, also inside the fix modal |
| 3. Confirm | TEAM / BRAND / SEASON card (season editable, "Override AI-detected season?"). Accordion: Kit type, Gender, Version, Position, Condition (KitLegit's 5 options), Purchase & notes. Suggested badges, auto-advance after 500ms | **Added:** Size (required), Listing text (name & number, description for buyers) with blocked words. Condition is required |
| 4. Price | — | **Locker:** valuation, price, payout options (partner rule), where it's shown, NFC notice. "List it for free" |
| Submitted | KitLegit shows its result | **Locker:** "Getting your listing ready" → "It's live!" or "We couldn't list this shirt". The check runs in the background; the seller never sees KitLegit |

Not ported (unused in KitLegit's live flow, or backend-only): StepIndicator, FloatingBottomBar, ConfirmationStep, MismatchDialog, MissingPhotosModal, QualityIssuesModal, PaywallModal, MobileCheckGate, the label-check and country-of-manufacture modals, AI re-classification on replace, adidas tag pairing.

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
