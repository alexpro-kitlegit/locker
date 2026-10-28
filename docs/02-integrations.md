# Integrations

Every external service the real product needs, and where the prototype fakes it. Picks come from the founders' draft (prices as of 16 Oct 2026, before VAT).

| # | Need | Pick | Fallback / later | Used by (flow) | Prototype |
|---|---|---|---|---|---|
| 1 | Take payment | **Stripe** (card, Apple Pay, Google Pay, Pay by Bank) | Braintree, Adyen | Checkout | Mock checkout, with Pay by Bank shown first |
| 2 | Hold the money, pay sellers | **Stripe Connect** | Mangopay (if the wallet grows) | Escrow, payouts, seller onboarding | Mock wallet and payout states |
| 3 | Labels and tracking | **ShipStation API** | Sendcloud | Seller dispatch (QR code), tracking, release on delivery | Fake QR code and tracking timeline |
| 4 | Carriers | **InPost + Evri** | Royal Mail (premium), DPD | Checkout delivery choice, drop-off | Static carrier options and prices |
| 5 | Club credit | **Shopify gift cards** (API) or **codes from the club** | Own credit shop; Fanatics (by agreement) | Seller payout → club credit | Fake gift-card code |
| 6 | Seller checks (KYC) + HMRC reporting | **Stripe Connect sign-up + Stripe tax reporting** | Stripe Identity (flagged only), Veriff | Seller onboarding, yearly HMRC file | Mock "verify to get paid" step |
| 7 | Fraud | **Stripe Radar** + own rules | Signifyd, SEON, Sift | Checkout, account security | Not shown |
| 8 | Support + disputes | **Help Scout** (already ours) + in-app AI helper | Freshdesk, Zendesk | Help, disputes | Mock help screen and dispute form |
| 9a | Chat | **Supabase Realtime** | Stream Chat | Buyer–seller chat per order | Mock chat thread |
| 9b | Email | **Resend** | — | Order emails | Not shown |
| 9c | Push | **Firebase Messaging** | — | Order alerts | Mock notifications list |
| 10 | App, stores, data | **Supabase, Cloudflare** (club domains), **PostHog** (analytics, per-club switches) | — | Everything; club subdomains | Club switcher simulates subdomains |
| 10b | AI | **Azure** (KitLegit's existing AI) | — | KitLegit check, scam detection in chat | Mock check result |
| 11 | Company, bank, books | Companies House, Starling, Xero | — | Back office | n/a |
| 12 | Legal + insurance | AI-drafted terms, Superscript, ICO | Sprintlaw review | Terms acceptance at sign-up | Checkbox only |

## Added by the seller flow (v0.2)

| Need | Pick | Used by | Prototype |
|---|---|---|---|
| Club sign-in (Shopify clubs) | **Shopify Customer Account API / Multipass**, as part of a Shopify plugin | "Continue with your club account", account linking | Mock button |
| Club sign-in (other clubs) | **OIDC / OAuth** with the club's identity provider | "Continue with Rovers ID" | Mock button |
| Fallback sign-in | Supabase Auth (email one-time code) | Clubs with no accounts | Mock |
| Phone camera without an install | **Apple App Clip** (inside The Locker iOS app). Mobile web camera on Android. | Hand-off from a club store to the phone | QR + "open on this device" |
| Live draft sync | Supabase Realtime on `listing_drafts` | Web ↔ phone hand-off | localStorage sync |
| Valuation | KitLegit check data + Locker sales | Price step | Formula with fake sample counts |

## Partner integrations (not suppliers)

| Partner | Integration | Prototype |
|---|---|---|
| **KitLegit** | Run a check inside the sell flow (photos → verdict → certificate). Dispatch check before shipping. Authentic/counterfeit stats for club analytics. The Locker pays per check. | Reuse KitLegit check UI with a mocked verdict |
| **KitLegit accounts** | "Continue with KitLegit" sign-in and a Connect button in Locker settings: KitLegit acts as an OAuth provider (scopes: checks, certificates, username). Needs a consent screen on KitLegit's side, a way to list a user's checks, and certificate transfer when a listed shirt sells. One way only | Consent sheet + linked flag on the user |
| **FanNFC** | Tamper-proof tag on high-value shirts, linked to the KitLegit certificate. Tap to verify. | Mock "tap to verify" screen |
| **Back Four** | Counterfeits are passed on for brand-protection action. | Shown on the ops/club side only |
| **Club shops** | Credit is issued into the club's shop (Shopify or codes). Monthly settlement. | Mock |

## Check before building (from the draft)

- Stripe accepts pre-owned branded shirts.
- Written OK from Stripe that a balance can pay for another seller's shirt (account debits, 1.4%).
- ShipStation terms allow labels for private sellers. Royal Mail's limit is 20 parcels a week.
- InPost rates through ShipStation, and a locker deal with no minimum volume.
- VAT treatment of club credit, and that credit for one club's shop isn't e-money.
- Access to Stripe's tax-reporting preview. The first HMRC report is due 31 Jan 2027.
- Which Radar price applies to platforms after 22 Jan 2027.
- Resend set up before launch.
- Online Safety Act risk assessments, due within 3 months of launch.
