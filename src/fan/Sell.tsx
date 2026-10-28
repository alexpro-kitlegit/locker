import clsx from "clsx";
import { AlertTriangle, Camera, Check, Loader2, Nfc, ShieldCheck, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShirtArt } from "../components/ShirtArt";
import { Button, Crest, PoweredByKitLegit, PrototypeControls, DemoButton, Row, TickCircle } from "../components/ui";
import { getClub } from "../data/clubs";
import { createListing, newCheckId, setNextVerdict } from "../lib/actions";
import { shirtTitle } from "../lib/format";
import { allInPrice, formatGBP, NFC_THRESHOLD, payoutAmount } from "../lib/pricing";
import { useLocker } from "../lib/store";
import type { Condition, ShirtType, Size } from "../lib/types";

type Step = "photos" | "checking" | "verdict" | "details" | "price" | "live";

// In the real app KitLegit identifies the shirt from the photos. Here the demo picks which shirt is in them.
const SAMPLE_SHIRTS: { clubId: string; type: ShirtType; season: string; suggest: [number, number] }[] = [
  { clubId: "harbour-city", type: "Home", season: "2023/24", suggest: [40, 55] },
  { clubId: "harbour-city", type: "Away", season: "1998/99", suggest: [90, 130] },
  { clubId: "northgate", type: "Third", season: "2022/23", suggest: [30, 45] },
];

const SLOTS: { id: string; label: string; required: boolean; label_photo?: boolean }[] = [
  { id: "front", label: "Front", required: true },
  { id: "back", label: "Back", required: true },
  { id: "neck", label: "Neck label", required: true, label_photo: true },
  { id: "wash", label: "Wash label", required: true, label_photo: true },
  { id: "style", label: "Style code", required: true, label_photo: true },
  { id: "swing", label: "Swing tag", required: false, label_photo: true },
];

const CHECK_STEPS = ["Matching the shirt", "Reading labels and codes", "Checking photo quality", "Issuing the certificate"];

/** Remount on every visit, so tapping Sell again starts a fresh listing. */
export function Sell() {
  const { key } = useLocation();
  return <SellFlow key={key} />;
}

function SellFlow() {
  const s = useLocker();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("photos");
  const [sample, setSample] = useState(0);
  const [photos, setPhotos] = useState<Record<string, boolean>>({});
  const [checkProgress, setCheckProgress] = useState(0);
  const [checkId] = useState(newCheckId);
  const [verdict, setVerdict] = useState<"authentic" | "counterfeit">("authentic");
  const [size, setSize] = useState<Size>("M");
  const [condition, setCondition] = useState<Condition>("Excellent");
  const [printing, setPrinting] = useState("");
  const [price, setPrice] = useState("");
  const [listingId, setListingId] = useState<string>();

  const shirt = SAMPLE_SHIRTS[sample];
  const club = getClub(shirt.clubId)!;
  const myClub = getClub(s.users[s.meId].clubId)!;
  const kit = club.kits[shirt.type];
  const pricePence = Math.round(parseFloat(price || "0") * 100);
  const requiredDone = SLOTS.filter((x) => x.required).every((x) => photos[x.id]);

  // Stands in for KitLegit's analyse-photos → submit-to-api → get-result pipeline.
  useEffect(() => {
    if (step !== "checking") return;
    setCheckProgress(0);
    const timers = CHECK_STEPS.map((_, i) => setTimeout(() => setCheckProgress(i + 1), 900 * (i + 1)));
    timers.push(
      setTimeout(() => {
        setVerdict(s.demo.nextVerdict);
        setStep("verdict");
      }, 900 * CHECK_STEPS.length + 500),
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  const publish = () => {
    const id = createListing({
      clubId: shirt.clubId,
      type: shirt.type,
      season: shirt.season,
      size,
      condition,
      price: pricePence,
      printing: printing || undefined,
      check: { id: checkId, verdict: "authentic", certificate: checkId, labels: "5 of 5", checkedAt: new Date().toISOString() },
    });
    setListingId(id);
    setStep("live");
  };

  if (step === "photos")
    return (
      <div className="space-y-5 px-4 pb-6 pt-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sell a shirt</h1>
          <p className="text-sm text-neutral-500">Free to list. KitLegit checks it here, so buyers know it's real.</p>
        </div>

        <PrototypeControls title="Prototype: which shirt is in the photos?">
          {SAMPLE_SHIRTS.map((x, i) => (
            <DemoButton key={i} onClick={() => setSample(i)} className="">
              {sample === i ? "● " : ""}
              {getClub(x.clubId)!.initials} {x.type} {x.season}
            </DemoButton>
          ))}
          <span className="w-full" />
          <DemoButton onClick={() => setNextVerdict(s.demo.nextVerdict === "authentic" ? "counterfeit" : "authentic")}>
            Check result: {s.demo.nextVerdict === "authentic" ? "Authentic" : "Counterfeit"} (tap to switch)
          </DemoButton>
        </PrototypeControls>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Photos</h2>
            <button
              className="text-xs font-semibold text-locker"
              onClick={() => setPhotos(Object.fromEntries(SLOTS.map((x) => [x.id, true])))}
            >
              Add sample photos
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SLOTS.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setPhotos((p) => ({ ...p, [slot.id]: !p[slot.id] }))}
                className={clsx(
                  "relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium",
                  photos[slot.id] ? "bg-tile" : "border-2 border-dashed border-neutral-200 text-neutral-500",
                )}
              >
                {photos[slot.id] ? (
                  slot.label_photo ? (
                    <Tag className="h-8 w-8 text-neutral-500" strokeWidth={1.4} />
                  ) : (
                    <ShirtArt kit={kit} className="h-16 w-16" />
                  )
                ) : (
                  <Camera className="h-5 w-5" />
                )}
                <span>{slot.label}</span>
                {!slot.required && !photos[slot.id] && <span className="text-[9px] text-neutral-400">Optional</span>}
                {photos[slot.id] && <TickCircle size="sm" className="absolute right-1.5 top-1.5" />}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Labels and codes are what KitLegit checks. Clear, close-up photos give the fastest result.
          </p>
        </div>

        <Button block disabled={!requiredDone} onClick={() => setStep("checking")}>
          <ShieldCheck className="h-4 w-4" /> Check with KitLegit
        </Button>
      </div>
    );

  if (step === "checking")
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <div className="relative grid h-28 w-28 place-items-center rounded-full bg-tile">
          <ShirtArt kit={kit} className="h-20 w-20" />
          <Loader2 className="absolute -right-1 -top-1 h-8 w-8 animate-spin text-ink" />
        </div>
        <div>
          <PoweredByKitLegit />
          <h1 className="mt-3 text-xl font-bold">Checking your shirt</h1>
          <p className="text-sm text-neutral-500">Usually under a minute.</p>
        </div>
        <ul className="w-full max-w-xs space-y-2 text-left">
          {CHECK_STEPS.map((label, i) => (
            <li key={label} className={clsx("flex items-center gap-2 text-sm", i >= checkProgress && "text-neutral-400")}>
              {i < checkProgress ? (
                <TickCircle size="sm" />
              ) : i === checkProgress ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="h-4 w-4 rounded-full border-2 border-neutral-200" />
              )}
              {label}
            </li>
          ))}
        </ul>
      </div>
    );

  if (step === "verdict" && verdict === "counterfeit")
    return (
      <div className="space-y-5 px-5 pb-6 pt-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid h-24 w-24 place-items-center rounded-full bg-red-50">
            <AlertTriangle className="h-11 w-11 text-red-600" />
          </span>
          <h1 className="text-2xl font-bold">We can't list this shirt</h1>
          <p className="text-sm text-neutral-500">KitLegit found signs it isn't authentic.</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 px-4">
          <Row label="Shirt matched" value={shirtTitle(shirt)} />
          <Row label="Style code" value={<span className="flex items-center gap-1 text-red-600"><X className="h-4 w-4" /> Wrong season</span>} />
          <Row label="Wash label" value={<span className="flex items-center gap-1 text-red-600"><X className="h-4 w-4" /> Doesn't match</span>} />
          <Row label="Check" value={checkId} />
        </div>
        <div className="space-y-2 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
          <p>This check is free. We've shared the result with Back Four, who protect clubs and brands from fakes.</p>
          <p>Think we got it wrong? A KitLegit expert can review it by hand.</p>
        </div>
        <div className="space-y-2">
          <Button block variant="dark">Ask for a manual review</Button>
          <Button block variant="secondary" onClick={() => navigate("/app")}>
            Back to home
          </Button>
        </div>
      </div>
    );

  if (step === "verdict")
    return (
      <div className="space-y-5 px-5 pb-6 pt-6">
        <Verdict title="Authentic" subtitle="Your shirt passed the KitLegit check." />
        <div className="rounded-2xl border border-neutral-200 px-4">
          <Row label="Shirt matched" value={shirtTitle(shirt)} tick />
          <Row label="Labels and codes" value="5 of 5" tick />
          <Row label="Photos" value="Clear" tick />
          <Row label="Certificate" value={checkId} />
        </div>
        <Button block onClick={() => setStep("details")}>
          Add details and price
        </Button>
      </div>
    );

  if (step === "details")
    return (
      <div className="space-y-5 px-4 pb-6 pt-1">
        <h1 className="text-xl font-bold">About your shirt</h1>
        <div className="flex items-center gap-3 rounded-2xl bg-tile p-3">
          <ShirtArt kit={kit} className="h-14 w-14" />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Crest club={club} className="h-4 w-4" /> {club.name}
            </p>
            <p className="text-sm">{shirtTitle(shirt)}</p>
            <p className="text-[11px] text-neutral-500">Identified by KitLegit</p>
          </div>
        </div>
        <Picker label="Size" options={["XS", "S", "M", "L", "XL", "XXL"] as Size[]} value={size} onChange={setSize} />
        <Picker
          label="Condition"
          options={["Brand new", "Excellent", "Good", "Fair"] as Condition[]}
          value={condition}
          onChange={setCondition}
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-bold">Name and number (optional)</span>
          <input
            value={printing}
            onChange={(e) => setPrinting(e.target.value.toUpperCase())}
            placeholder="e.g. REYES 9"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-locker"
          />
        </label>
        <Button block onClick={() => setStep("price")}>
          Continue
        </Button>
      </div>
    );

  if (step === "price") {
    const credit = payoutAmount(pricePence, "club_credit");
    return (
      <div className="space-y-5 px-4 pb-6 pt-1">
        <h1 className="text-xl font-bold">Set your price</h1>
        <div>
          <label className="flex items-baseline gap-1 border-b-2 border-ink pb-1">
            <span className="text-3xl font-bold">£</span>
            <input
              autoFocus
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className="w-full bg-transparent text-3xl font-bold outline-none"
            />
          </label>
          <p className="mt-2 text-xs text-neutral-500">
            Similar shirts sold for £{shirt.suggest[0]}–£{shirt.suggest[1]} in the last 90 days.
          </p>
        </div>

        {pricePence > 0 && (
          <>
            <div className="rounded-2xl bg-neutral-50 p-4 text-sm">
              <p className="mb-2 font-semibold">When it sells, you choose</p>
              <PayoutLine label={`${myClub.name} credit`} note="110%, best value" value={credit} highlight />
              <PayoutLine label="Spend in The Locker" value={payoutAmount(pricePence, "locker_balance")} />
              <PayoutLine label="Cash to your bank" note="5% + 50p fee" value={payoutAmount(pricePence, "bank")} />
              <p className="mt-2 border-t border-neutral-200 pt-2 text-xs text-neutral-500">
                Buyers pay {formatGBP(allInPrice(pricePence))} including buyer protection, plus postage.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-neutral-200 p-4 text-sm">
              <p className="font-semibold">Where it's shown</p>
              <p className="flex items-center gap-2">
                <Check className="h-4 w-4 text-locker" /> The Locker app
              </p>
              <p className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-locker" />
                <span>
                  {club.name} store
                  <span className="block text-xs text-neutral-400">{club.domain}</span>
                </span>
              </p>
            </div>
            {pricePence >= NFC_THRESHOLD && (
              <div className="flex gap-3 rounded-2xl bg-locker-soft p-4 text-sm">
                <Nfc className="h-5 w-5 shrink-0 text-locker" />
                <p>
                  <span className="font-semibold">High-value shirt.</span> We'll post you a free FanNFC tag. Fix it
                  to the shirt before you send it, so the buyer can tap to prove it's the one we checked.
                </p>
              </div>
            )}
          </>
        )}

        <Button block disabled={pricePence < 500} onClick={publish}>
          List it for free
        </Button>
      </div>
    );
  }

  // live
  return (
    <div className="space-y-5 px-5 pb-6 pt-6">
      <Verdict title="Authentic" subtitle="Your shirt passed the KitLegit check." />
      <div className="rounded-2xl border border-neutral-200 px-4">
        <Row label="Shirt matched" value={shirtTitle(shirt)} tick />
        <Row label="Labels and codes" value="5 of 5" tick />
        <Row label="Photos" value="Clear" tick />
        <Row label="Certificate" value={checkId} />
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-locker-soft p-3 text-sm font-semibold">
        <TickCircle tone="locker" />
        Live in The Locker and the {club.name} store
      </div>
      <Button block onClick={() => navigate(`/app/listing/${listingId}`)}>
        View my listing
      </Button>
    </div>
  );
}

function Verdict({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="grid h-24 w-24 place-items-center rounded-full bg-ink">
        <Check className="h-12 w-12 text-white" strokeWidth={3} />
      </span>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-neutral-500">{subtitle}</p>
    </div>
  );
}

function Picker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-bold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-sm font-medium",
              value === o ? "bg-ink text-white" : "bg-neutral-100 text-neutral-700",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function PayoutLine({ label, note, value, highlight }: { label: string; note?: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span>
        {label}
        {note && <span className="ml-1.5 text-xs text-neutral-500">{note}</span>}
      </span>
      <span className={clsx("font-semibold", highlight && "text-locker")}>{formatGBP(value)}</span>
    </div>
  );
}
