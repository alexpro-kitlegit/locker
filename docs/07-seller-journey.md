# Seller journey: what's needed end to end

The seller journey as agreed, then everything else it depends on: missing steps, business rules, integrations and legal. Items marked ★ are the ones most likely to block launch.

## The journey as agreed

1. **List.** Reuse KitLegit's check flow almost 1:1. The check runs silently, and the seller isn't told about the analysis or the certificate.
2. **Shipping.** Not chosen by the seller. The buyer picks the carrier at checkout, like Vinted.
3. **Wait.** The listing is live.
4. **Sold.** The seller gets a shipping label: a digital QR code, or a PDF to download and print.
5. **Wait, then get paid.** After delivery, the seller chooses how to be paid.

## Decisions (28 Oct 2026)

| Topic | Decision |
|---|---|
| Seller details | Collected at **onboarding** (address, Stripe Connect KYC and bank, NI/UTR), not at the first sale |
| Dispatch deadline | Yes. 5 working days with reminders, then auto-cancel and refund |
| Buyer acceptance window | **48 hours** after delivery, then the order completes and the money is released |
| Disputes | Yes: not received, damaged, not as described, wrong shirt, "it's fake". A person decides each one |
| Labels | Created on payment. QR code or PDF to print, emailed and re-downloadable. "No printer" preference |
| Locker balance / e-money | Being looked into. **Key decision point**, raise again before the flowchart is final |
| Dispatch check | **Not a seller step.** It belongs to the buyer side and will be designed later. The seller just gets the label |
| Already-certified shirts | Yes. Owned by someone else → blocked. Owned by the seller → re-list without a new check |
| Failed checks | **3 failures in a row → account temporarily on hold** while we investigate |
| Minimum price | **None** |
| Listing text | Blocked words: listings containing them can't be submitted (name/number, description) |
| Offers | Yes, like Vinted: buyer makes an offer; seller accepts, declines or counters |
| Messages (pre-sale questions) | Open, see the recommendation below |

### Recommendation on messages

Allow them, in the Vinted model where the conversation and offers live in one thread per listing and buyer, with guardrails:
- **Offers need a thread anyway.** Accept, decline and counter need a place to happen, and questions about marks, fit or measurements are what close a sale.
- **Guardrails:** AI blocks or flags phone numbers, emails, bank details and "pay outside the app"; quick-reply prompts ("Any marks or pulls?", "Player or stadium version?", "Measurements?"); report and block. Messages stay with the order as dispute evidence.
- **Cost:** chat makes us a user-to-user service under the Online Safety Act either way (offers alone would too), so the extra legal work is small.
- **Lighter fallback if we want to wait:** offers only, plus a fixed set of structured questions the seller answers with a tap. No free text.

## Missing steps

### Before the first listing
- ★ **Seller address.** The label needs a "from" address, and returns need one too. Postcode lookup at onboarding (decided).
- ★ **Seller verification (KYC) and payout details.** Stripe Connect needs name, date of birth, address and bank. HMRC reporting needs an NI number or UTR. Decided: collected at onboarding.
- **Private or business seller.** Business sellers ("traders") have extra consumer-law duties (see Legal). Ask once at onboarding.
- **Seller terms, accepted once.**
- **Shipping preferences (light).** The buyer picks the carrier, but the seller should be able to turn carriers off, e.g. "I don't have a printer" hides print-only carriers (DPD). Vinted has this in settings.
- **Parcel size.** A shirt is always a small parcel, so we set it automatically. Nothing to ask.

### Listing (the KitLegit flow, 1:1)
- The full KitLegit steps: select → upload → processing → season select (when the season is ambiguous) → review (re-sort photos, quality issues, mismatch) → confirm → submit. The prototype only has a simplified version.
- **Removed labels need evidence** in KitLegit. Decide whether the seller is asked during listing, or only when the background check needs it.
- **Already-certified shirts.** If KitLegit already knows this shirt (`product_instances` / `current_owner`):
  - owned by someone else → block it, or flag it as possibly stolen;
  - owned by this seller (bought on The Locker) → re-list without a full check. Cheaper, and a selling point.
- **Duplicates.** Stop the same shirt being listed twice.
- **Photo moderation.** Faces, addresses or offensive content in photos.

### While it's listed
- **Manage the listing:** edit the price (no re-check), withdraw, hide while on holiday.
- **Notifications:** live, couldn't list, someone liked it, a question, an offer.
- **Buyer questions and chat,** with AI scam flags. The chat is per listing before the sale and per order after.
- **Offers:** decided, like Vinted (offer → accept / decline / counter).
- **Listing expiry and price-drop nudges** ("similar shirts sell for £x").

### When it sells
- ★ **Sale alert:** push, email and in-app, with the label attached.
- ★ **Label created automatically on payment** (ShipStation), using the buyer's carrier:
  - QR code for InPost, Evri and Royal Mail at Post Office counters;
  - PDF to print for DPD and Royal Mail at home;
  - downloadable in the app and the club store account, emailed, and re-issuable if lost.
- ★ **Dispatch deadline:** e.g. 5 working days, with reminders. After that the order is auto-cancelled and the buyer refunded, which counts against the seller's record.
- **Seller cancels** (damaged, lost, changed their mind): refund the buyer, and limit how often a seller can do it.
- **Packing guidance,** plus "fix the FanNFC tag" for high-value shirts. The tag is posted to the seller when the listing goes live.
- **Dispatch check:** decided, not a seller step. It moves to the buyer side, to be designed later.
- **Drop-off point finder** (InPost / Evri points near the seller).

### Delivery and after
- ★ **Buyer acceptance window:** 48 hours after delivery (decided) to report a problem, then the order completes automatically and the money is released (Vinted's model).
- ★ **Disputes:** not received, damaged in transit, not as described, wrong shirt, and "it's fake" (despite the check). Each needs evidence, return rules (who pays return postage), a person's decision and refund logic.
- **Lost or damaged parcels:** carrier claims. Evri through ShipStation has no loss cover, so the protection pot pays.
- **Certificate and ownership transfer** to the buyer on completion (KitLegit `ownership_history` pending transfer → completed).
- **Ratings and reviews** both ways after completion.

### Payout
- ★ **KYC must be complete** before any payout. Prompt for it at the sale, not after delivery.
- **Timing:** release on completion, not on the delivery scan. Bank payouts take 1–2 working days.
- **Club credit:** issue the gift card or code, and email it. Decide expiry and terms (non-refundable, not exchangeable for cash), and what happens if a club leaves the partnership.
- ★ **Locker balance limits:** Stripe requires balances to be paid out within 90 days. Auto-pay to bank, or nudge to spend? Holding value may also be e-money (see Legal).
- **Seller earnings history and a yearly statement** (also needed for HMRC).

## Business rules to decide

| Rule | Starting point |
|---|---|
| Minimum / maximum price | No minimum (decided). A max for new sellers? |
| Price vs valuation | Far below valuation is a scam signal: flag it, don't block |
| Limits for new sellers | Max live listings, max value, hold the first payout for extra days |
| High-value threshold | NFC tag + Stripe Identity ID check at £100+ (placeholder) |
| Failed checks | 3 failures in a row → account on hold while we investigate (decided). Fakes passed to Back Four |
| Dispatch deadline | 5 working days |
| Buyer acceptance window | 2 days after delivery |
| Who funds the extra 10% of club credit | Club (it's spent in their shop) or us? Settlement terms per club |
| Listing visibility | App + the shirt's club store (current). The store it was listed from too? |
| Fees | Seller free. Buyer: 5% + 70p (to confirm) |

## Integrations for the seller journey

| Need | Service | Notes |
|---|---|---|
| Check flow, certificate, ownership | **KitLegit** (analyse-photos, ocr-photos, classify-photos, submit-to-api, get-result) | Reuse the components and edge functions. Needs a partner API key / tenant for The Locker, and a webhook when the result is ready |
| Valuation | KitLegit data + Locker sales | New service or view |
| Seller onboarding, KYC, payouts | **Stripe Connect** (Express) | Hosted onboarding saves building forms |
| HMRC reporting | Stripe tax reporting (preview) | Needs the seller's NI number or UTR |
| High-value ID check | Stripe Identity | Only for flagged or high-value sellers |
| Labels, QR codes, tracking | **ShipStation API** → InPost, Evri, Royal Mail, DPD | Label on payment; tracking webhooks drive the order status |
| Drop-off points | InPost / Evri point APIs | Map in the app |
| Address lookup | getAddress.io / Ideal Postcodes / Loqate | Seller address at onboarding |
| Club credit | Shopify Gift Card API, or code batches | Per club |
| Notifications | Resend (email + label PDF), Firebase (push), SMS optional | Dispatch reminders matter most |
| Photos, drafts, chat | Supabase Storage + Realtime | |
| Disputes and support | Help Scout | Evidence from our back end |
| NFC tags | FanNFC | Register the tag against the certificate; posting tags to sellers |
| Brand protection | Back Four | Counterfeit hand-off |

## Legal and compliance (seller side)

- ★ **HMRC platform reporting** (UK reporting rules for digital platforms): collect and report sellers with 30+ sales or about £1,700+ a year, by 31 January. We need date of birth, address, and NI number or UTR.
- ★ **Terms:** seller terms (listing rules, prohibited items, dispatch duties, cancellations, disputes, fees), buyer terms, and how KitLegit's check is described. "Checked by KitLegit" must not read as a guarantee we can't back. Insurance has to cover it.
- ★ **Consumer law:**
  - private sellers: the Consumer Rights Act doesn't apply between two private people, but our own service and protection promise must be clear;
  - business sellers: must be shown as traders, and the buyer gets the 14-day cancellation right (Consumer Contracts Regulations).
- **DMCC Act 2024:** mandatory fees must be in the headline price (our all-in price does this; postage can stay separate because the buyer chooses it), and fake reviews are banned.
- **Payments and e-money:** Stripe holds the money, not us. Check whether the Locker balance and single-club credit fall under the e-money rules or an exemption (the PDF already flags one accountant call).
- **Data protection (UK GDPR):** who is controller for what between The Locker, KitLegit, clubs and Back Four; data-sharing agreements; privacy notice; how long photos and drafts are kept; personal data in photos.
- **Online Safety Act:** chat makes us a user-to-user service. Illegal-content risk assessment and children's access assessment within 3 months of launch, reporting tools, and a minimum age (likely 18 for selling, given payouts).
- **IP:** club crests and names in white-label stores are covered by the partner agreement. For non-partner clubs, use the name as a description only, no crest.
- **Carrier and ShipStation terms:** labels for private sellers, prohibited items.
