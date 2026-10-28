# Data model (draft)

A working list that grows as we build each screen. **Reuse** means an existing KitLegit table (see the kitlegit-web Supabase schema). **New** means Locker-only.

Whether The Locker shares KitLegit's Supabase project or gets its own is still open (see [open questions](04-open-questions.md)). That decides whether "reuse" means shared tables or a cross-project API.

## From the PDF (first pass)

| Entity | Reuse / New | Notes |
|---|---|---|
| `profiles` | Reuse | Fans. Needs Locker-side fields: Stripe Connect account ID, KYC status, HMRC data (date of birth, NI number), default payout preference. |
| `checks`, `check_details`, `current_effective_results` | Reuse | A KitLegit check per listing, plus a **dispatch check** before shipping. |
| `certificates` | Reuse | Issued by KitLegit and linked from the listing and the NFC tag. |
| `product_instances` | Reuse | One physical shirt. A shirt can be resold many times. |
| `current_owner` / `ownership_history` | Reuse | A completed sale = an ownership transfer (the `pending_transfer_*` events already exist). |
| `clubs` | New | Name, crest, colours, template, subdomain/custom domain, credit method (Shopify / codes / own shop), status. |
| `club_domains` | New | Domain, DNS record status (Cloudflare). |
| `listings` | New | Seller, product_instance, check, price, size, condition, status (draft / checking / live / reserved / sold / withdrawn), the club stores it shows in. |
| `listing_photos` | New or reuse | Might reuse the check photos. |
| `orders` | New | Buyer, listing, all-in price breakdown (item, fees, postage, protection), payment method, status, source (Locker app / club store + club ID). |
| `shipments` | New | Carrier, QR/label, tracking number, tracking events, delivered_at. Delivery releases the money. |
| `payouts` | New | Seller, order, method (club_credit / locker_balance / bank), amount, fee, status. |
| `club_credit_issuances` | New | Club, seller, gift-card code / Shopify ID, value, settlement month. |
| `wallet_balances` / `wallet_ledger` | New | The "spend in The Locker" balance. Ledger-based, like `token_ledger`. Stripe's 90-day limit applies. |
| `conversations`, `messages` | New | Per order. AI scam flags on messages. |
| `disputes` | New | Order, opened_by, reason, evidence (chat, photos, tracking), decision, decided_by (always a person). |
| `nfc_tags` | New | FanNFC tag ID, certificate, product_instance, status. |
| `club_statements` | New | Monthly: credit issued, sales, payable to the club. |
| `kitlegit_statements` | New | Monthly: checks performed × price per check. |
| `counterfeit_reports` | New | Fakes caught at listing, passed on to Back Four. |
| `reviews` | New? | Mentioned in the draft's legal terms ("reviews"). |

## Learned while building the sale loop (v0.1)

The prototype's shapes are in [`src/lib/types.ts`](../src/lib/types.ts). Points worth carrying into the schema:

- **`orders.channel` + `orders.club_id`:** record where the sale happened (Locker app or a club store). Club analytics and any revenue share depend on it.
- **Store the money breakdown on the order:** `item_price`, `buyer_fee`, `postage`, `total`. Don't recompute later, because fees will change.
- **`orders.dispatch_check_id`:** the second KitLegit check, linked to the order. It's the seller's evidence in a "not as described" dispute.
- **`payouts.club_id`:** club credit goes to the *seller's* club (their profile club), not the shirt's club. A Harbour City fan selling a Northgate shirt gets Harbour City credit. See the open questions.
- **Payout is chosen after delivery**, not at listing. A sale has a "delivered, payout not chosen" state that needs a reminder and a 90-day Stripe limit.
- **Listing visibility:** a listing shows in the app and in the store of the *shirt's* club. If that becomes configurable, add a `listing_stores` join table.
- **Sold listings stay visible** in club stores (marked Sold) as social proof, so the store queries live + recently sold.
- **`listings.check_id`** is required: no check, no listing. Counterfeit verdicts never create a listing, only a `counterfeit_reports` row.
- **NFC tags** are assigned at listing when the price is at or above a threshold (placeholder £100). The tag is posted to the seller and fixed before dispatch.
- **Order status set:** `paid → dispatched → in_transit → delivered`, then payout. Disputes branch from any status after `paid`.

## Learned while building the seller flow (v0.2)

- **One Locker account per fan** (see [accounts](06-accounts.md)), plus **`account_links`** (user, provider `shopify` / `club_sso`, external ID, club). **`profiles.favourite_club_id`** is picked at sign-up.
- **`clubs.is_partner`**: partner clubs have a store and offer 110% credit. Other clubs' shirts can still be sold, in the app only. **`clubs.brand`** drives the required photos.
- **`listing_drafts`**: owner, where it was started (app or which club store), identified shirt, photo slots (status + storage path), details, price, current step, updated_at. It syncs live between devices for the web → phone hand-off.
- **Photo slots reuse KitLegit's model:** slot IDs (front, back, neck-label, wash-label, style-code, security-label, hologram, swing-tag, other) and statuses (uploaded, not-present, removed, damaged). Required slots come from KitLegit's **`brand_requirements`** (front, back, wash label by default, plus brand extras).
- **Listing status adds `in_review` and `rejected`:** the listing is saved straight away and waits while the KitLegit check runs in the background. `in_review → live` or `rejected`. The seller only ever sees "Getting ready" or "Couldn't list".
- **`listings.listed_via`**: app or a club store (for club analytics and attribution).
- **Valuation:** an estimate built from KitLegit check data (purchase price on `check_details`) plus Locker sale prices, by shirt, condition and size. It needs a `valuations` view or service.
- **Payout rule:** club credit is issued at the **shirt's** club, only if it's a partner. The seller's favourite club doesn't affect it. Otherwise: Locker balance or cash.
- **Balances are per user** (ledger-based, like `token_ledger`).

## Pricing rules seen so far

- Buyer pays one all-in price: item + our fee + postage (+ protection?).
- Seller payout: club credit = 110%, Locker balance = 100%, bank = 95% − 50p.
- Pots per sale: 50p support, 1% buyer protection.
