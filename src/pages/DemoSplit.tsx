import clsx from "clsx";
import { Lock, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Crest, LockerLogo } from "../components/ui";
import { PARTNER_CLUBS as CLUBS } from "../data/clubs";
import { setStoreUser } from "../lib/actions";
import { PhoneFrame, StatusBar } from "../fan/FanLayout";
import { resetState, useLocker } from "../lib/store";

/** The fan app and a club store side by side, sharing one set of prototype data. */
export function DemoSplit() {
  const [clubId, setClubId] = useState(CLUBS[0].id);
  const [frameKey, setFrameKey] = useState(0);
  const s = useLocker();
  const club = CLUBS.find((c) => c.id === clubId)!;

  const reset = () => {
    resetState();
    setFrameKey((k) => k + 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 lg:h-screen">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-neutral-200 bg-white px-5 py-3">
        <Link to="/">
          <LockerLogo />
        </Link>
        <p className="text-sm text-neutral-600">
          <span className="font-semibold text-ink">Side-by-side demo.</span> Sell in the app on the left, buy in the
          club store on the right. Both share the same data.
        </p>
        <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-locker">
          <RotateCcw className="h-4 w-4" /> Reset demo
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-6 p-5 lg:flex-row lg:items-stretch">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <PhoneFrame>
            <div className="flex h-full flex-col bg-white">
              <StatusBar />
              <iframe key={`app-${frameKey}`} src="/app" title="The Locker app" className="w-full flex-1" />
            </div>
          </PhoneFrame>
          <p className="text-xs font-medium text-neutral-500">The Locker app · signed in as Sam</p>
        </div>

        <div className="flex min-h-[640px] w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-xl">
          <div className="flex items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
            <span className="flex gap-1.5">
              {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
              ))}
            </span>
            <span className="flex flex-1 items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs text-neutral-600 ring-1 ring-neutral-200">
              <Lock className="h-3 w-3" /> {club.domain}
            </span>
            <div className="flex gap-1">
              {CLUBS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClubId(c.id)}
                  title={c.name}
                  className={clsx("rounded-md p-1", c.id === clubId ? "bg-white ring-1 ring-neutral-300" : "opacity-50 hover:opacity-100")}
                >
                  <Crest club={c} className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
          <iframe key={`${clubId}-${frameKey}`} src={`/store/${clubId}`} title={`${club.name} store`} className="w-full flex-1" />
          <div className="flex items-center gap-2 border-t border-neutral-100 px-3 py-1.5 text-xs text-neutral-500">
            Club store · signed in as
            <select
              value={s.storeUserId ?? ""}
              onChange={(e) => setStoreUser(e.target.value || null)}
              className="rounded border border-neutral-200 bg-white px-1 py-0.5"
            >
              <option value="">nobody (signed out)</option>
              <option value="u-sam">Sam, the seller (same account as the app)</option>
              <option value="u-jordan">Jordan, a buyer</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
