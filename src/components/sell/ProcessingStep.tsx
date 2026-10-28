import clsx from "clsx";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

// KitLegit shows football facts from its football_facts table while it analyses. A few stand-ins:
const FACTS = [
  { cat: "History", text: "The first official international match was Scotland v England in 1872. It finished 0–0." },
  { cat: "Shirts", text: "Squad numbers with players' names on the back arrived in the Premier League in 1993–94." },
  { cat: "Shirts", text: "Shirt sponsors first appeared on English club shirts in the late 1970s." },
  { cat: "Labels", text: "A wash label usually tells you where a shirt was made and exactly what it's made of." },
];

const STAGES = ["Uploading photos", "Analysing details", "Preparing review"];

/** KitLegit's Processing step: rotating facts and three stages, on screen for at least 5 seconds. */
export function ProcessingStep({ onDone }: { onDone: () => void }) {
  const [fact, setFact] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const f = setInterval(() => setFact((i) => (i + 1) % FACTS.length), 7000);
    const s1 = setTimeout(() => setStage(1), 1500);
    const done = setTimeout(() => {
      setStage(3);
      setTimeout(onDone, 400);
    }, 5000);
    return () => {
      clearInterval(f);
      clearTimeout(s1);
      clearTimeout(done);
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-10 px-4 py-10 text-center">
      <div className="space-y-3">
        <span className="inline-block rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">{FACTS[fact].cat}</span>
        <p className="text-sm text-neutral-400">Did you know...</p>
        <p key={fact} className="text-[22px] font-semibold leading-snug">
          {FACTS[fact].text}
        </p>
        <div className="flex justify-center gap-1">
          {FACTS.map((_, i) => (
            <span key={i} className={clsx("h-1.5 rounded-full", i === fact ? "w-4 bg-accent" : "w-1.5 bg-neutral-300")} />
          ))}
        </div>
      </div>
      <div className="flex w-full items-center justify-center gap-2 border-t border-neutral-100 pt-6">
        {STAGES.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span className="flex flex-col items-center gap-1.5">
              <span className={clsx("grid h-7 w-7 place-items-center rounded-full", i < stage ? "bg-accent text-on-accent" : "border-2 border-neutral-200")}>
                {i < stage ? <Check className="h-4 w-4" /> : i === stage ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : null}
              </span>
              <span className={clsx("text-[11px] font-medium", i > stage && "text-neutral-400")}>{label}</span>
            </span>
            {i < STAGES.length - 1 && <span className="mb-5 h-px w-8 bg-neutral-200" />}
          </div>
        ))}
      </div>
    </div>
  );
}
