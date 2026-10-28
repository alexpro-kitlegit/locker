import clsx from "clsx";
import { BadgeCheck, Building2, FileText, Landmark, Loader2, MapPin, ShieldCheck, User } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { completeOnboarding } from "../lib/actions";
import { useLocker } from "../lib/store";
import type { SellerProfile } from "../lib/types";
import { Button, PrototypeControls } from "./ui";

type Step = "intro" | "about" | "address" | "tax" | "stripe" | "terms" | "done";
const STEPS: Step[] = ["about", "address", "tax", "stripe", "terms"];

// Prototype: the fake addresses a postcode lookup (getAddress.io / Ideal Postcodes) would return.
const ADDRESSES = ["12 Bridge Street", "14 Alder Close", "3 Mill Lane", "Flat 2, 40 Harbour Road"];

/**
 * Seller onboarding, done once before the first listing. Everything here is what the law, Stripe and the labels
 * need: ID and bank (Stripe Connect), an address for labels and returns, and a tax ID for HMRC reporting.
 */
export function Onboarding({ userId, onDone }: { userId: string; onDone: () => void }) {
  const s = useLocker();
  const user = s.users[userId];
  const [step, setStep] = useState<Step>("intro");
  const [p, setP] = useState<Partial<SellerProfile>>({ type: "private" });
  const [postcode, setPostcode] = useState("BS3 4QR");
  const [found, setFound] = useState(false);
  const [stripe, setStripe] = useState<"idle" | "checking" | "done">("idle");
  const [agree, setAgree] = useState({ terms: false, prohibited: false });
  const set = (patch: Partial<SellerProfile>) => setP((x) => ({ ...x, ...patch }));
  const index = STEPS.indexOf(step);

  useEffect(() => {
    if (stripe !== "checking") return;
    const t = setTimeout(() => setStripe("done"), 1800);
    return () => clearTimeout(t);
  }, [stripe]);

  if (step === "intro")
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Start selling</h1>
          <p className="text-sm text-neutral-500">A few details, once. It takes about 3 minutes.</p>
        </div>
        <ul className="space-y-3">
          <Why icon={<User className="h-4 w-4" />} title="About you" text="Your name and date of birth, and whether you sell as a person or a business." />
          <Why icon={<MapPin className="h-4 w-4" />} title="Your address" text="It goes on shipping labels, and it's where returns come back to." />
          <Why icon={<FileText className="h-4 w-4" />} title="Tax details" text="The law says we report sellers with 30+ sales or about £1,700 a year to HMRC." />
          <Why icon={<Landmark className="h-4 w-4" />} title="ID and bank, with Stripe" text="Our payment partner checks your ID once and pays your money out." />
        </ul>
        <Button block onClick={() => setStep("about")}>
          Get started
        </Button>
      </div>
    );

  if (step === "done")
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-on-accent">
          <BadgeCheck className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-bold">You're ready to sell</h1>
        <p className="max-w-xs text-sm text-neutral-500">Your ID and bank are verified. Money from your sales lands in your wallet.</p>
        <Button block className="max-w-xs" onClick={onDone}>
          Sell a shirt
        </Button>
      </div>
    );

  const next = () => setStep(STEPS[index + 1] ?? "done");
  const finish = () => {
    completeOnboarding(userId, { ...p, bankLast4: "8812" });
    setStep("done");
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-1">
        {STEPS.map((x, i) => (
          <span key={x} className={clsx("h-1 flex-1 rounded-full", i <= index ? "bg-accent" : "bg-neutral-200")} />
        ))}
      </div>

      {step === "about" && (
        <>
          <Title title="About you" sub="This must match your ID." />
          <Field label="Full name" value={user.name} readOnly />
          <Field label="Date of birth" type="date" value={p.dob ?? ""} onChange={(v) => set({ dob: v })} />
          <div className="space-y-1.5">
            <p className="text-sm font-bold">You're selling as</p>
            <div className="grid grid-cols-2 gap-2">
              <Choice on={p.type === "private"} onClick={() => set({ type: "private" })} icon={<User className="h-4 w-4" />} title="A person" sub="Clearing out your own shirts" />
              <Choice on={p.type === "business"} onClick={() => set({ type: "business" })} icon={<Building2 className="h-4 w-4" />} title="A business" sub="You buy shirts to resell" />
            </div>
          </div>
          {p.type === "business" && (
            <>
              <Field label="Business name" value={p.businessName ?? ""} onChange={(v) => set({ businessName: v })} />
              <p className="rounded-2xl bg-neutral-50 p-3 text-xs text-neutral-600">
                Business sellers show as businesses to buyers, who then get a 14-day right to cancel.
              </p>
            </>
          )}
          <Button block disabled={!p.dob || (p.type === "business" && !p.businessName)} onClick={next}>
            Continue
          </Button>
          <PrototypeControls title="Prototype">
            <button className="text-xs font-semibold text-amber-800 underline" onClick={() => set({ dob: "1995-06-21" })}>
              Fill in a date of birth
            </button>
          </PrototypeControls>
        </>
      )}

      {step === "address" && (
        <>
          <Title title="Your address" sub="For shipping labels and returns. Buyers only see your town." />
          <div className="flex gap-2">
            <Field label="Postcode" value={postcode} onChange={(v) => setPostcode(v.toUpperCase())} />
            <Button className="mt-6 shrink-0" variant="secondary" onClick={() => setFound(true)}>
              Find address
            </Button>
          </div>
          {found && (
            <div className="space-y-2">
              {ADDRESSES.map((a) => (
                <Choice
                  key={a}
                  on={p.address?.line1 === a}
                  onClick={() => set({ address: { line1: a, city: user.city, postcode } })}
                  icon={<MapPin className="h-4 w-4" />}
                  title={a}
                  sub={`${user.city} ${postcode}`}
                />
              ))}
            </div>
          )}
          <Button block disabled={!p.address} onClick={next}>
            Continue
          </Button>
        </>
      )}

      {step === "tax" && (
        <>
          <Title
            title="Tax details"
            sub={`Online marketplaces must report sellers with 30+ sales or about £1,700 a year to HMRC. We need your ${p.type === "business" ? "UTR" : "National Insurance number"} to do that.`}
          />
          <Field
            label={p.type === "business" ? "Unique Taxpayer Reference (UTR)" : "National Insurance number"}
            value={p.taxId ?? ""}
            placeholder={p.type === "business" ? "10 digits" : "QQ 12 34 56 C"}
            onChange={(v) => set({ taxId: v.toUpperCase() })}
          />
          <p className="text-xs text-neutral-500">We only share it with HMRC, and only if you go over the limits.</p>
          <Button block disabled={(p.taxId ?? "").length < 6} onClick={next}>
            Continue
          </Button>
          <PrototypeControls title="Prototype">
            <button className="text-xs font-semibold text-amber-800 underline" onClick={() => set({ taxId: p.type === "business" ? "1234567890" : "QQ123456C" })}>
              Fill in a test number
            </button>
          </PrototypeControls>
        </>
      )}

      {step === "stripe" && (
        <>
          <Title title="ID and bank" sub="Stripe, our payment partner, checks your ID once and pays out your money. We never see your ID." />
          <div className="space-y-3 rounded-2xl border border-neutral-200 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-[#635BFF]" /> Stripe verification
              <span className="ml-auto rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">Prototype mock</span>
            </p>
            <Row label="Photo ID" value={stripe === "done" ? "Passport · verified" : "Not added"} ok={stripe === "done"} />
            <Row label="Selfie" value={stripe === "done" ? "Matched" : "Not added"} ok={stripe === "done"} />
            <Row label="Bank account" value={stripe === "done" ? "Sort code ••-••-21 · ••••8812" : "Not added"} ok={stripe === "done"} />
            {stripe !== "done" && (
              <Button block variant="dark" disabled={stripe === "checking"} onClick={() => setStripe("checking")}>
                {stripe === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {stripe === "checking" ? "Checking with Stripe…" : "Verify with Stripe"}
              </Button>
            )}
          </div>
          <Button block disabled={stripe !== "done"} onClick={next}>
            Continue
          </Button>
        </>
      )}

      {step === "terms" && (
        <>
          <Title title="Seller terms" sub="The short version:" />
          <ul className="space-y-1.5 text-sm text-neutral-700">
            <li>• Every shirt is checked before it goes on sale. Fakes are never listed.</li>
            <li>• Send within 5 working days of a sale, or it's cancelled and the buyer refunded.</li>
            <li>• The buyer has 48 hours after delivery to report a problem. A person decides every dispute.</li>
            <li>• Keep chat and payment in The Locker.</li>
            <li>• Three shirts in a row that don't pass puts your account on hold while we take a look.</li>
          </ul>
          <Check on={agree.terms} onClick={() => setAgree((a) => ({ ...a, terms: !a.terms }))}>
            I agree to the seller terms and privacy policy
          </Check>
          <Check on={agree.prohibited} onClick={() => setAgree((a) => ({ ...a, prohibited: !a.prohibited }))}>
            I'll only sell shirts I own, and never replicas
          </Check>
          <Button block disabled={!agree.terms || !agree.prohibited} onClick={finish}>
            Finish
          </Button>
        </>
      )}
    </div>
  );
}

function Title({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-neutral-500">{sub}</p>
    </div>
  );
}

function Why({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">{icon}</span>
      <span className="text-sm">
        <span className="font-semibold">{title}.</span> <span className="text-neutral-600">{text}</span>
      </span>
    </li>
  );
}

function Field({ label, value, onChange, readOnly, type = "text", placeholder }: { label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; type?: string; placeholder?: string }) {
  return (
    <label className="block flex-1 space-y-1">
      <span className="text-sm font-bold">{label}</span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={clsx("w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-accent", readOnly && "bg-neutral-50 text-neutral-500")}
      />
    </label>
  );
}

function Choice({ on, onClick, icon, title, sub }: { on: boolean; onClick: () => void; icon: ReactNode; title: string; sub: string }) {
  return (
    <button onClick={onClick} className={clsx("flex w-full items-start gap-2 rounded-2xl border p-3 text-left", on ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-neutral-200")}>
      <span className="mt-0.5 text-accent">{icon}</span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="text-xs text-neutral-500">{sub}</span>
      </span>
    </button>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className={clsx("font-medium", ok && "text-green-700")}>{value}</span>
    </div>
  );
}

function Check({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-start gap-2 text-left text-sm">
      <span className={clsx("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border", on ? "border-accent bg-accent text-on-accent" : "border-neutral-300")}>{on && "✓"}</span>
      {children}
    </button>
  );
}
