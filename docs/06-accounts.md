# Accounts: one Locker account, linked to the club's

**Decision (proposed):** every fan has **one Locker account**. They use it in The Locker app and in every club's white-label store. Where a club already has customer accounts, we **link** to them, so the fan signs in with the club login they already know and never sees a separate sign-up.

## Why one Locker account, not the club's account on its own

- **Money and law are per person, not per club.** Stripe Connect checks the seller's ID, holds their balance and pays them out. HMRC reporting (30+ sales or over €2,000 a year) covers all of a seller's sales. Spreading one person across several club accounts breaks all three.
- **One wallet, one reputation.** The Locker balance, ratings, sales history and listings follow the fan across clubs. A Harbour City fan can sell a Northgate shirt and get Northgate credit.
- **One draft across devices.** A listing started on a club's website carries on in the App Clip or The Locker app (same account, same draft).
- **Not every club has accounts we can use.** We need a fallback anyway.

## How a fan signs in on a club store

| Club set-up | What the fan sees | Under the hood | Demo club |
|---|---|---|---|
| **Shop on Shopify** | "Continue with your Harbour City FC account". Often already signed in. | Shopify plugin. Customer Account API / Multipass links the Shopify customer to a Locker account on first use. Gift-card credit can attach to the same customer. | Harbour City FC |
| **Club has its own login** (tickets, membership) | "Continue with Rovers ID" | OIDC / OAuth with the club's identity provider, linked the same way | Northgate Rovers |
| **No usable accounts** | Email + one-time code, in club colours | A plain Locker account | Kingsmere Athletic |

In every case the result is a Locker account with a link to the club identity (`account_links`: provider, external ID, club).

## Profile on the club's white-label store

Yes, the club store needs a profile area (`/store/:club/account` in the prototype). It's the **same Locker account** seen through the club's skin, and it shows everything, not just that club:

- Needs you: payouts to choose, sales to send (sending hands off to the phone)
- Unfinished listings (drafts), with "continue here" or "continue on your phone"
- Your listings for any club, with status: Getting ready / Live / Couldn't list / Sold
- Wallet: Locker balance and club credit codes
- What you've bought

## Open points

- **Customer data:** who owns it? Clubs will want the fans' data, and the PDF lists it as "to decide". Linking gives the club a shared customer ID without handing over our records.
- **Club SSO effort:** each non-Shopify club login is its own integration. Do we offer it at launch, or only Shopify + email?
- **Account merging:** a fan who signed up by email and later uses "Continue with Harbour City FC account" with the same email. Auto-link, or ask first?
- **App Clip:** needs our own native iOS app (an App Clip ships inside it). Android has no current equivalent, so Android fans use the mobile web camera or the app.
