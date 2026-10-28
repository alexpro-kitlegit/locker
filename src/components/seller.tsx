import clsx from "clsx";
import { AlertTriangle, Loader2, Printer, Star, Sun, Tag } from "lucide-react";
import { useState } from "react";
import {
  leaveReview,
  relistWithdrawn,
  requestExpertReview,
  setExpertVerdict,
  updatePrice,
  updateSeller,
  withdrawListing,
} from "../lib/actions";
import { EXPERT_REVIEW_FEE, formatGBP, HMRC_LIMITS } from "../lib/pricing";
import { taxYear } from "../lib/reputation";
import { LISTING_STATUS } from "../lib/status";
import { useLocker } from "../lib/store";
import type { Listing } from "../lib/types";
import { Button, DemoButton, PrototypeControls } from "./ui";

/** The seller's view of their own listing: status, price, withdraw/relist, and the paid expert review if it was rejected. */
export function ManageListing({ listing }: { listing: Listing }) {
  const s = useLocker();
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState((listing.price / 100).toFixed(2));
  const [confirmExpert, setConfirmExpert] = useState(false);
  const status = LISTING_STATUS[listing.status];

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Your listing</p>
        <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold", status.tone)}>{status.label}</span>
      </div>

      {listing.status === "in_review" && <p className="text-sm text-neutral-600">We're checking a few details. We'll let you know when it's live.</p>}

      {listing.status === "rejected" && (
        <div className="space-y-3">
          <p className="flex gap-2 text-sm text-neutral-600">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            {listing.expertReview?.outcome === "counterfeit"
              ? "A KitLegit expert confirmed it isn't authentic, so it can't be listed. We've shared the result with Back Four."
              : "Our authentication team couldn't approve it. Think we got it wrong? A KitLegit expert can check every photo by hand."}
          </p>
          {!listing.expertReview &&
            (confirmExpert ? (
              <div className="space-y-2 rounded-2xl bg-neutral-50 p-3 text-sm">
                <p>
                  An expert review costs <span className="font-semibold">{formatGBP(EXPERT_REVIEW_FEE)}</span> and usually takes up to 24 hours. If the expert
                  confirms it's authentic, your listing goes live. The fee pays for the expert's time, so it isn't refunded either way.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => setConfirmExpert(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => requestExpertReview(listing.id)}>Pay {formatGBP(EXPERT_REVIEW_FEE)}</Button>
                </div>
              </div>
            ) : (
              <Button block variant="dark" onClick={() => setConfirmExpert(true)}>
                Ask an expert ({formatGBP(EXPERT_REVIEW_FEE)})
              </Button>
            ))}
        </div>
      )}

      {listing.status === "expert_review" && (
        <>
          <p className="flex items-center gap-2 text-sm text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> A KitLegit expert is checking your photos by hand. We'll let you know.
          </p>
          <PrototypeControls title="Prototype: the expert's decision">
            <DemoButton onClick={() => setExpertVerdict(s.demo.expertVerdict === "authentic" ? "counterfeit" : "authentic")}>
              Expert says: {s.demo.expertVerdict === "authentic" ? "Authentic" : "Not authentic"} (tap to switch)
            </DemoButton>
          </PrototypeControls>
        </>
      )}

      {listing.status === "live" &&
        (editing ? (
          <div className="flex gap-2">
            <label className="flex flex-1 items-baseline gap-1 rounded-xl border border-neutral-200 px-3 py-2">
              £<input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} className="w-full bg-transparent font-semibold outline-none" inputMode="decimal" />
            </label>
            <Button
              onClick={() => {
                updatePrice(listing.id, Math.round(parseFloat(price || "0") * 100));
                setEditing(false);
              }}
              disabled={!(parseFloat(price) > 0)}
            >
              Save
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Tag className="h-4 w-4" /> Edit price
            </Button>
            <Button variant="secondary" onClick={() => withdrawListing(listing.id)}>
              Withdraw
            </Button>
          </div>
        ))}
      {listing.status === "live" && listing.previousPrice && (
        <p className="text-xs text-neutral-500">Price dropped from {formatGBP(listing.previousPrice)}. Buyers who liked it get a nudge.</p>
      )}

      {listing.status === "withdrawn" && (
        <>
          <p className="text-sm text-neutral-600">It's hidden from buyers. Put it back up any time. It doesn't need checking again.</p>
          <Button block onClick={() => relistWithdrawn(listing.id)}>
            Put it back up
          </Button>
        </>
      )}
    </div>
  );
}

/** Selling settings: holiday mode, no printer, bundle discount. */
export function SellerSettings({ userId }: { userId: string }) {
  const s = useLocker();
  const p = s.users[userId].seller;
  if (p.status !== "verified") return null;
  return (
    <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
      <Toggle
        icon={<Sun className="h-4 w-4" />}
        title="Holiday mode"
        sub="Hide all your listings until you're back."
        on={!!p.holiday}
        onClick={() => updateSeller(userId, { holiday: !p.holiday })}
      />
      <Toggle
        icon={<Printer className="h-4 w-4" />}
        title="I don't have a printer"
        sub="Buyers only see carriers with a QR code at drop-off."
        on={!!p.noPrinter}
        onClick={() => updateSeller(userId, { noPrinter: !p.noPrinter })}
      />
      <div className="flex items-center gap-3 px-4 py-3 text-sm">
        <Tag className="h-4 w-4 text-neutral-500" />
        <div className="flex-1">
          <p className="font-medium">Bundle discount</p>
          <p className="text-xs text-neutral-500">When someone buys 2 or more of your shirts.</p>
        </div>
        <select value={p.bundleDiscount} onChange={(e) => updateSeller(userId, { bundleDiscount: Number(e.target.value) })} className="rounded-lg border border-neutral-200 px-2 py-1 text-sm">
          {[0, 5, 10, 15, 20].map((d) => (
            <option key={d} value={d}>
              {d ? `${d}%` : "None"}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Toggle({ icon, title, sub, on, onClick }: { icon: React.ReactNode; title: string; sub: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm">
      <span className="text-neutral-500">{icon}</span>
      <span className="flex-1">
        <span className="block font-medium">{title}</span>
        <span className="text-xs text-neutral-500">{sub}</span>
      </span>
      <span className={clsx("relative h-6 w-10 rounded-full transition", on ? "bg-accent" : "bg-neutral-200")}>
        <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition", on ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}

/** This year against HMRC's reporting limits, with a warning as the seller gets close. */
export function TaxCard({ userId }: { userId: string }) {
  const s = useLocker();
  const t = taxYear(s, userId);
  if (s.users[userId].seller.status !== "verified") return null;
  return (
    <div className={clsx("space-y-3 rounded-2xl p-4 text-sm", t.near ? "bg-amber-50" : "bg-neutral-50")}>
      <div className="flex items-center justify-between">
        <p className="font-semibold">HMRC reporting, {t.year}</p>
        <button className="text-xs font-semibold text-accent">Download statement</button>
      </div>
      <Meter label="Sales" value={t.sales} max={HMRC_LIMITS.sales} text={`${t.sales} of ${HMRC_LIMITS.sales}`} />
      <Meter label="Earnings" value={t.earnings} max={HMRC_LIMITS.earnings} text={`${formatGBP(t.earnings)} of ${formatGBP(HMRC_LIMITS.earnings)}`} />
      <p className="text-xs text-neutral-600">
        {t.over
          ? "You've passed a limit, so we'll include your sales in our report to HMRC in January. You may need to tell HMRC about this income."
          : t.near
            ? "You're close to a limit. If you pass 30 sales or about £1,700 this year, we have to report your sales to HMRC in January."
            : "Online marketplaces report sellers with 30+ sales or about £1,700 a year to HMRC."}
      </p>
    </div>
  );
}

function Meter({ label, value, max, text }: { label: string; value: number; max: number; text: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-neutral-500">{label}</span>
        <span className="font-medium">{text}</span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-200">
        <div className={clsx("h-full rounded-full", pct >= 80 ? "bg-amber-500" : "bg-accent")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Rate the other side once an order completes. */
export function ReviewPrompt({ orderId, from, to }: { orderId: string; from: string; to: string }) {
  const s = useLocker();
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const done = s.reviews.find((r) => r.orderId === orderId && r.from === from);
  const name = s.users[to].name.split(" ")[0];

  if (done)
    return (
      <p className="flex items-center gap-1 rounded-2xl bg-neutral-50 p-3 text-sm text-neutral-600">
        You rated {name} {Array.from({ length: done.stars }, (_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
      </p>
    );

  return (
    <div className="space-y-2 rounded-2xl border border-neutral-200 p-4">
      <p className="text-sm font-semibold">How was {name}?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setStars(n)} aria-label={`${n} stars`}>
            <Star className={clsx("h-7 w-7", n <= stars ? "fill-amber-400 text-amber-400" : "text-neutral-300")} />
          </button>
        ))}
      </div>
      {stars > 0 && (
        <>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Anything to add? (optional)"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <Button block onClick={() => leaveReview(orderId, from, to, stars, text.trim())}>
            Send rating
          </Button>
        </>
      )}
    </div>
  );
}
