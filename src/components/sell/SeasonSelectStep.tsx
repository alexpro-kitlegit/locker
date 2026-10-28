import clsx from "clsx";
import { Search } from "lucide-react";
import { useState } from "react";
import { CLUBS, getClub } from "../../data/clubs";
import { BRANDS } from "../../data/slots";
import type { Draft } from "../../lib/types";
import { Button } from "../ui";

const ERAS = [
  { label: "1960s", from: 1960, to: 1969 },
  { label: "1970s", from: 1970, to: 1979 },
  { label: "1980s", from: 1980, to: 1989 },
  { label: "Early 90s", from: 1990, to: 1993 },
  { label: "Mid 90s", from: 1994, to: 1999 },
  { label: "Early 2000s", from: 2000, to: 2004 },
  { label: "Mid 2000s", from: 2005, to: 2009 },
  { label: "2010s", from: 2010, to: 2019 },
  { label: "Recent", from: 2020, to: 2025 },
];

const season = (y: number) => `${y}/${String((y + 1) % 100).padStart(2, "0")}`;

/**
 * KitLegit's SeasonSelectStep: shown when the analysis isn't confident about team, brand or season.
 * Team & Brand, then Era, then Season. Back from the first sub-step returns to Upload.
 */
export function SeasonSelectStep({
  draft,
  onConfirm,
  onRestart,
}: {
  draft: Draft;
  onConfirm: (identified: NonNullable<Draft["identified"]>) => void;
  onRestart: () => void;
}) {
  const id = draft.identified!;
  const [sub, setSub] = useState<"team" | "era" | "season">("team");
  const [clubId, setClubId] = useState(id.clubId);
  const [brand, setBrand] = useState(id.brand);
  const [era, setEra] = useState<(typeof ERAS)[number]>();
  const [picked, setPicked] = useState<string>();
  const steps = id.season ? ["team"] : ["team", "era", "season"];
  const index = steps.indexOf(sub);
  const confirm = (s: string | undefined) => onConfirm({ ...id, clubId, brand, season: s, confident: true });

  const back = () => {
    if (sub === "team") onRestart();
    else setSub(sub === "season" ? "era" : "team");
  };

  return (
    <div className="mx-auto max-w-[480px] space-y-5 px-4 py-8">
      <div className="flex gap-1">
        {steps.map((s, i) => (
          <span key={s} className={clsx("h-1 flex-1 rounded-full", i <= index ? "bg-accent" : "bg-neutral-200")} />
        ))}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Step {index + 1} of {steps.length}: {sub === "team" ? "Team & Brand" : sub === "era" ? "Era" : "Season"}
      </p>

      {sub === "team" && (
        <>
          <div>
            <h1 className="text-2xl font-bold">Confirm team &amp; brand</h1>
            <p className="text-sm text-neutral-500">Select the team and brand to narrow down the available seasons.</p>
          </div>
          <SearchSelect
            label="Club / Team"
            placeholder="Search for team…"
            value={getClub(clubId)?.name ?? ""}
            options={CLUBS.map((c) => ({ value: c.id, label: c.name }))}
            onPick={(v) => {
              setClubId(v);
              setBrand(getClub(v)!.brand);
            }}
          />
          <SearchSelect label="Brand" placeholder="Search for brand…" value={brand} options={BRANDS.map((b) => ({ value: b, label: b }))} onPick={setBrand} />
          <Nav back={back}>
            <Button onClick={() => (id.season ? confirm(id.season) : setSub("era"))}>{id.season ? "Confirm →" : "Continue →"}</Button>
          </Nav>
        </>
      )}

      {sub === "era" && (
        <>
          <div>
            <h1 className="text-2xl font-bold">Which era is your shirt?</h1>
            <p className="text-sm text-neutral-500">Select the era that best matches your shirt.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ERAS.map((e) => (
              <button
                key={e.label}
                onClick={() => {
                  setEra(e);
                  setSub("season");
                }}
                className="rounded-2xl border border-neutral-200 p-4 text-left hover:border-accent"
              >
                <p className="font-semibold">{e.label}</p>
                <p className="text-xs text-neutral-500">{e.label === "Recent" ? "2020 – now" : `${e.from} – ${e.to}`}</p>
              </button>
            ))}
            <button onClick={() => confirm(undefined)} className="rounded-2xl border border-dashed border-neutral-300 p-4 text-left">
              <p className="font-semibold">Not Sure</p>
              <p className="text-xs text-neutral-500">We'll take it from here</p>
            </button>
          </div>
          <Nav back={back}>
            <Button disabled>Select an Era to Continue →</Button>
          </Nav>
        </>
      )}

      {sub === "season" && era && (
        <>
          <div>
            <h1 className="text-2xl font-bold">{era.label === "Recent" ? "Which season?" : `Which season in the ${era.label}?`}</h1>
            <p className="text-sm text-neutral-500">Pick the exact season, or select "Not sure" if you're uncertain.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: era.to - era.from + 1 }, (_, i) => season(era.from + i)).map((s) => (
              <button
                key={s}
                onClick={() => setPicked(s)}
                className={clsx("rounded-xl border py-3 text-sm font-semibold", picked === s ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-neutral-200")}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => setPicked(season(Math.floor((era.from + era.to) / 2)))}
              className="rounded-xl border border-dashed border-neutral-300 py-3 text-sm text-neutral-500"
            >
              Not sure
            </button>
          </div>
          <Nav back={back}>
            <Button disabled={!picked} onClick={() => confirm(picked)}>
              Continue to Photo Review →
            </Button>
          </Nav>
        </>
      )}
    </div>
  );
}

function Nav({ back, children }: { back: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <Button variant="ghost" onClick={back}>
        ← Back
      </Button>
      {children}
    </div>
  );
}

function SearchSelect({
  label,
  placeholder,
  value,
  options,
  onPick,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: { value: string; label: string }[];
  onPick: (v: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const matches = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative space-y-1.5">
      <p className="text-sm font-bold">{label}</p>
      <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus-within:border-accent">
        <Search className="h-4 w-4 text-neutral-400" />
        <input
          value={open ? q : value}
          onFocus={() => {
            setOpen(true);
            setQ("");
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none"
        />
      </label>
      {open && (
        <div className="absolute z-10 max-h-56 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
          {q.length === 0 && <p className="px-3 py-2 text-xs text-neutral-400">Type to search…</p>}
          {matches.map((o) => (
            <button
              key={o.value}
              onMouseDown={() => {
                onPick(o.value);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
