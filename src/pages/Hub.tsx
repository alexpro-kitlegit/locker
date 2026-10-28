import { ArrowRight, Columns2, RotateCcw, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { Crest, LockerLogo, PoweredByKitLegit } from "../components/ui";
import { ACCOUNT_METHOD_NAMES, CREDIT_METHOD_NAMES, PARTNER_CLUBS, TEMPLATE_NAMES } from "../data/clubs";
import { setNextVerdict } from "../lib/actions";
import { resetState, useLocker } from "../lib/store";

const SCRIPT = [
  ["Sign in on the club store", "In the Harbour City store, tap Sell yours. Sam signs in with their Harbour City FC account, linked to a Locker account."],
  ["Start on the web", "Upload a few photos (or add 3 samples). The next step asks for the labels this brand needs."],
  ["Finish on the phone", "Missing labels? Scan the code to carry on in the App Clip or The Locker app. The phone shows the same draft."],
  ["List it", "Add details, see the valuation, set a price. The KitLegit check runs quietly in the background, then the listing goes live."],
  ["Buy", "Switch the store to Jordan and buy it. Pay by bank is first. The money is held."],
  ["Send", "Back in the app, Wallet shows To send. Do the dispatch check and get the drop-off QR code."],
  ["Deliver", "Use the prototype controls to scan and deliver the parcel. The club store order updates too."],
  ["Get paid", "Partner club shirt: 110% club credit, Locker balance or cash. Non-partner club shirt: Locker balance or cash."],
];

const NEXT = [
  { title: "Club portal", text: "Onboarding, template and colours, domain set-up, credit settings, sales and fakes analytics, monthly statements." },
  { title: "Locker ops", text: "Disputes (a person decides each one), flagged chats, payouts, KitLegit checks, clubs." },
  { title: "Messages and disputes", text: "Buyer–seller chat per order with AI scam flags, and the full dispute flow." },
];

export function Hub() {
  const s = useLocker();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl space-y-12 px-5 py-10 sm:py-14">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <LockerLogo className="text-lg" />
            <PoweredByKitLegit />
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">Prototype</span>
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">The Locker sells. KitLegit checks.</h1>
          <p className="max-w-2xl text-lg text-neutral-600">
            A marketplace where fans buy and sell pre-owned shirts, every one checked by KitLegit before it goes on sale.
            Clubs get their own resale store in club colours, and the credit is spent in their shop.
          </p>
          <p className="text-sm text-neutral-500">
            Rough prototype for the team. No backend: payments, shipping and the KitLegit check are simulated, and data
            lives in this browser.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <Link to="/demo" className="group rounded-3xl bg-locker p-6 text-white md:col-span-2">
            <Columns2 className="h-7 w-7" />
            <h2 className="mt-3 text-xl font-bold">Side-by-side demo</h2>
            <p className="mt-1 text-white/80">The app and a club store next to each other. Best for showing the whole sale.</p>
            <span className="mt-4 inline-flex items-center gap-1 font-semibold">
              Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>

          <Link to="/app" className="group rounded-3xl border border-neutral-200 p-6 hover:border-neutral-300">
            <Smartphone className="h-7 w-7 text-locker" />
            <h2 className="mt-3 text-xl font-bold">The Locker app</h2>
            <p className="mt-1 text-sm text-neutral-600">
              For fans. Not white-labelled. Sell with the KitLegit check built in, buy from every club, and get paid.
            </p>
          </Link>

          <div className="rounded-3xl border border-neutral-200 p-6">
            <h2 className="text-xl font-bold">Club stores</h2>
            <p className="mt-1 text-sm text-neutral-600">One site, themed per club. Fans buy and sell here. Each demo club has a different template and sign-in set-up.</p>
            <div className="mt-4 space-y-2">
              {PARTNER_CLUBS.map((c) => (
                <Link key={c.id} to={`/store/${c.id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-neutral-50">
                  <Crest club={c} className="h-8 w-8" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {c.domain} · {TEMPLATE_NAMES[c.template!]} template · {CREDIT_METHOD_NAMES[c.creditMethod!]} · {ACCOUNT_METHOD_NAMES[c.accountMethod!]}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-neutral-400" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="mb-4 text-xl font-bold">Demo script: one sale, end to end</h2>
            <ol className="space-y-3">
              {SCRIPT.map(([title, text], i) => (
                <li key={title} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">{i + 1}</span>
                  <p className="text-sm text-neutral-600">
                    <span className="font-semibold text-ink">{title}.</span> {text}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-neutral-500">
              Shortcut: Sam already has a delivered sale (£56.41), so Wallet opens straight onto the payout choice.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3 rounded-3xl border border-dashed border-amber-400 bg-amber-50 p-5">
              <h2 className="font-bold">Prototype settings</h2>
              <label className="flex items-center justify-between gap-3 text-sm">
                Next KitLegit result
                <select
                  value={s.demo.nextVerdict}
                  onChange={(e) => setNextVerdict(e.target.value as "authentic" | "counterfeit")}
                  className="rounded-lg border border-amber-300 bg-white px-2 py-1"
                >
                  <option value="authentic">Authentic</option>
                  <option value="counterfeit">Counterfeit</option>
                </select>
              </label>
              <button onClick={resetState} className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                <RotateCcw className="h-4 w-4" /> Reset demo data
              </button>
            </div>

            <div className="rounded-3xl bg-neutral-50 p-5">
              <h2 className="mb-3 font-bold">Coming next</h2>
              <ul className="space-y-3">
                {NEXT.map((n) => (
                  <li key={n.title} className="text-sm">
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-neutral-500">{n.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
