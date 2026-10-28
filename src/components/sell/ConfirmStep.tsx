import clsx from "clsx";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { getClub } from "../../data/clubs";
import { blockedWords } from "../../lib/moderation";
import type { Condition, Draft, Gender, KitType, KitVersion, ListingDetails, Position, Size } from "../../lib/types";
import { patchDraft } from "./flow";
import { Sheet, SheetButton } from "./Sheet";

const SEASONS = Array.from({ length: 40 }, (_, i) => {
  const y = 2025 - i;
  return `${y}/${String((y + 1) % 100).padStart(2, "0")}`;
});

const CONDITIONS: { value: Condition; sub: string }[] = [
  { value: "New with tags", sub: "Never worn, tags on" },
  { value: "New without tags", sub: "Never worn, no tags" },
  { value: "Excellent", sub: "Worn 1–2×" },
  { value: "Average", sub: "Visible wear" },
  { value: "Poor", sub: "Heavy wear" },
];

/** What stops the seller moving on to price: season (as KitLegit), plus size and condition for the listing. */
export function confirmProblems(d: Draft): string[] {
  const p: string[] = [];
  if (!d.identified?.season) p.push("Select the season.");
  if (!d.details.size) p.push("Select the size.");
  if (!d.details.condition) p.push("Select the condition.");
  const words = blockedWords(`${d.details.printing ?? ""} ${d.details.description ?? ""}`);
  if (words.length) p.push(`Remove "${words.join('", "')}". It isn't allowed in listings.`);
  return p;
}

type SectionId = "size" | "kitType" | "gender" | "version" | "position" | "condition" | "listing" | "purchase";

/** KitLegit's ConfirmStep (top card + accordion), with The Locker's size and listing-text sections added. */
export function ConfirmStep({ draft, attempted }: { draft: Draft; attempted: boolean }) {
  const d = draft.details;
  const id = draft.identified!;
  const club = getClub(id.clubId)!;
  const [open, setOpen] = useState<SectionId | null>("size");
  const [override, setOverride] = useState<string | null>(null);
  const set = (patch: Partial<ListingDetails>) => patchDraft(draft.id, (x) => ({ details: { ...x.details, ...patch } }));
  const order: SectionId[] = ["size", "kitType", "gender", "version", "position", "condition", "listing", "purchase"];

  // KitLegit: picking an option moves on to the next unfinished section after 500ms; tapping it again clears it.
  const pick = <K extends keyof ListingDetails>(section: SectionId, key: K, value: ListingDetails[K]) => {
    const clearing = d[key] === value;
    set({ [key]: clearing ? undefined : value } as Partial<ListingDetails>);
    if (!clearing) {
      setTimeout(() => {
        const after = order.slice(order.indexOf(section) + 1);
        setOpen(after.find((s) => s !== "listing" && s !== "purchase" && !doneOf(s)) ?? after[0] ?? null);
      }, 500);
    }
  };
  const doneOf = (s: SectionId) =>
    s === "listing" || s === "purchase" ? false : !!d[s as keyof ListingDetails];

  const suggestedType: KitType | undefined = id.type === "Goalkeeper" ? undefined : id.type;
  const suggestNewWithTags = !!draft.slots["swing-tag"]?.photo;
  const problems = confirmProblems(draft);
  const seasonHelper = !id.season ? "Season not detected. Please select." : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-neutral-200 p-4">
        <Field label="Team">
          <p className="truncate rounded-lg bg-neutral-50 px-2.5 py-2 text-sm text-neutral-500">{club.name}</p>
        </Field>
        <Field label="Brand">
          <p className="truncate rounded-lg bg-neutral-50 px-2.5 py-2 text-sm text-neutral-500">{id.brand}</p>
        </Field>
        <Field label="Season">
          <select
            value={id.season ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (id.season && id.confident && v !== id.season) setOverride(v);
              else patchDraft(draft.id, (x) => ({ identified: { ...x.identified!, season: v } }));
            }}
            className={clsx("w-full rounded-lg border px-2 py-2 text-sm", !id.season ? "border-red-300" : "border-neutral-200")}
          >
            <option value="" disabled>
              Select season
            </option>
            {SEASONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        {seasonHelper && <p className="col-span-3 text-xs font-medium text-red-600">{seasonHelper}</p>}
      </div>

      <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
        <Section id="size" title="Size" value={d.size} open={open} setOpen={setOpen} locker>
          <Cards options={["XS", "S", "M", "L", "XL", "XXL"] as Size[]} value={d.size} onPick={(v) => pick("size", "size", v)} />
        </Section>
        <Section id="kitType" title="Kit type" value={d.kitType} suggested={!d.kitType && !!suggestedType} open={open} setOpen={setOpen}>
          <Cards
            options={["Home", "Away", "Third", "Fourth", "Training", "Not sure"] as KitType[]}
            value={d.kitType}
            suggested={suggestedType}
            onPick={(v) => pick("kitType", "kitType", v)}
          />
        </Section>
        <Section id="gender" title="Gender" value={d.gender} open={open} setOpen={setOpen}>
          <Cards options={["Men's", "Women's", "Children's", "Unisex"] as Gender[]} value={d.gender} onPick={(v) => pick("gender", "gender", v)} />
        </Section>
        <Section id="version" title="Version" value={d.version} open={open} setOpen={setOpen}>
          <Cards options={["Stadium", "Player", "Not sure"] as KitVersion[]} value={d.version} onPick={(v) => pick("version", "version", v)} />
        </Section>
        <Section id="position" title="Position" value={d.position} open={open} setOpen={setOpen}>
          <Cards options={["Outfield", "Goalkeeper", "Not sure"] as Position[]} value={d.position} onPick={(v) => pick("position", "position", v)} />
        </Section>
        <Section id="condition" title="Condition" value={d.condition} suggested={!d.condition && suggestNewWithTags} open={open} setOpen={setOpen}>
          <Cards
            options={CONDITIONS.map((c) => c.value)}
            subs={Object.fromEntries(CONDITIONS.map((c) => [c.value, c.sub]))}
            value={d.condition}
            suggested={suggestNewWithTags ? "New with tags" : undefined}
            onPick={(v) => pick("condition", "condition", v)}
          />
        </Section>
        <Section id="listing" title="Listing text" value={d.printing || d.description ? "Added" : undefined} open={open} setOpen={setOpen} locker>
          <div className="space-y-3">
            <Input label="Name and number (optional)" value={d.printing} placeholder="e.g. REYES 9" onChange={(v) => set({ printing: v.toUpperCase() || undefined })} />
            <label className="block space-y-1">
              <span className="text-xs font-semibold">Description for buyers (optional)</span>
              <textarea
                value={d.description ?? ""}
                onChange={(e) => set({ description: e.target.value || undefined })}
                rows={3}
                placeholder="Fit, any marks, where you got it…"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
            {blockedWords(`${d.printing ?? ""} ${d.description ?? ""}`).length > 0 && (
              <p className="text-xs font-medium text-red-600">
                Remove "{blockedWords(`${d.printing ?? ""} ${d.description ?? ""}`).join('", "')}". It isn't allowed in listings.
              </p>
            )}
          </div>
        </Section>
        <Section id="purchase" title="Purchase & notes" value={d.purchasePlace} open={open} setOpen={setOpen}>
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold">Where from</span>
              <input
                list="purchase-places"
                value={d.purchasePlace ?? ""}
                onChange={(e) => set({ purchasePlace: e.target.value || undefined })}
                placeholder="eBay, Nike store, friend…"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <datalist id="purchase-places">
                <option value={`${club.name} Official Shop`} />
                <option value={`${id.brand} Store`} />
                <option value="eBay" />
                <option value="Vinted" />
                <option value="Classic Football Shirts" />
                <option value="Gift / friend" />
              </datalist>
            </label>
            <div className="grid grid-cols-[96px_1fr] gap-2">
              <label className="block space-y-1">
                <span className="text-xs font-semibold">Price paid</span>
                <select value={d.currency ?? "GBP"} onChange={(e) => set({ currency: e.target.value })} className="w-full rounded-xl border border-neutral-200 px-2 py-2 text-sm">
                  {["GBP", "EUR", "USD", "AED", "AUD", "CAD", "CHF", "JPY", "SGD"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <Input label={"\u00a0"} value={d.purchasePrice} placeholder="0.00" onChange={(v) => set({ purchasePrice: v.replace(/[^0-9.]/g, "") || undefined })} />
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-semibold">User notes</span>
              <textarea
                value={d.notes ?? ""}
                onChange={(e) => set({ notes: e.target.value || undefined })}
                rows={2}
                placeholder="Not used by AI for authentication. Only reviewed during manual authentication if needed."
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>
        </Section>
      </div>

      {attempted && problems.length > 0 && (
        <ul className="space-y-1 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {problems.map((p) => (
            <li key={p}>• {p}</li>
          ))}
        </ul>
      )}

      {override && (
        <Sheet title="Override AI-detected season?" sub="Please confirm you'd like to alter the suggested season. This may affect your check result." onClose={() => setOverride(null)}>
          <div className="grid grid-cols-2 gap-2 pb-2 text-center text-sm">
            <div className="rounded-xl bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">AI detected</p>
              <p className="font-semibold">{id.season}</p>
            </div>
            <div className="rounded-xl bg-accent/5 p-3">
              <p className="text-xs text-neutral-500">Your choice</p>
              <p className="font-semibold">{override}</p>
            </div>
          </div>
          <SheetButton onClick={() => setOverride(null)}>Keep {id.season}</SheetButton>
          <SheetButton
            variant="primary"
            onClick={() => {
              patchDraft(draft.id, (x) => ({ identified: { ...x.identified!, season: override } }));
              setOverride(null);
            }}
          >
            Change to {override}
          </SheetButton>
        </Sheet>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{label}</p>
      {children}
    </div>
  );
}

function Section({
  id,
  title,
  value,
  suggested,
  open,
  setOpen,
  locker,
  children,
}: {
  id: SectionId;
  title: string;
  value?: string;
  suggested?: boolean;
  open: SectionId | null;
  setOpen: (s: SectionId | null) => void;
  locker?: boolean;
  children: ReactNode;
}) {
  const isOpen = open === id;
  return (
    <div>
      <button onClick={() => setOpen(isOpen ? null : id)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <span className="flex-1 font-semibold">
          {title}
          {locker && <span className="ml-2 text-[10px] font-medium uppercase text-neutral-400">The Locker</span>}
        </span>
        {value && <CheckCircle2 className="h-4 w-4 text-green-600" />}
        {!isOpen &&
          (value ? (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{value}</span>
          ) : suggested ? (
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">SUGGESTED</span>
          ) : (
            <span className="text-xs text-neutral-400">Not set</span>
          ))}
        <ChevronDown className={clsx("h-4 w-4 transition", isOpen && "rotate-180")} />
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function Cards<T extends string>({
  options,
  value,
  suggested,
  subs,
  onPick,
}: {
  options: T[];
  value?: T;
  suggested?: T;
  subs?: Record<string, string>;
  onPick: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          className={clsx("relative rounded-xl border p-3 text-left text-sm", value === o ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-neutral-200")}
        >
          <span className="font-semibold">{o}</span>
          {subs?.[o] && <span className="block text-[11px] text-neutral-500">{subs[o]}</span>}
          {suggested === o && value !== o && <span className="absolute right-1.5 top-1.5 rounded-full bg-green-50 px-1.5 text-[9px] font-bold text-green-700">Suggested</span>}
        </button>
      ))}
    </div>
  );
}

function Input({ label, value, placeholder, onChange }: { label: ReactNode; value?: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold">{label}</span>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
