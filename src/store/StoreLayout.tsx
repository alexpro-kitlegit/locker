import clsx from "clsx";
import { ExternalLink, X } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { QrCode } from "../components/QrCode";
import { Button, Crest, LockerLogo } from "../components/ui";
import { getClub } from "../data/clubs";
import { accentVars } from "../lib/format";
import type { Club } from "../lib/types";

const ClubContext = createContext<Club | null>(null);
export const useClub = () => useContext(ClubContext)!;

/** One store site for every club. The club (and so the theme) comes from the domain in production, the URL here. */
export function StoreLayout() {
  const { clubId } = useParams();
  const club = getClub(clubId);
  const [sellOpen, setSellOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  if (!club) return <Navigate to="/" replace />;

  const base = `/store/${club.id}`;
  const embedded = window.self !== window.top;

  return (
    <ClubContext.Provider value={club}>
      <div style={accentVars(club.primary, club.secondary, club.onPrimary)} className="flex min-h-screen flex-col bg-white">
        <header
          className={clsx(
            club.template === "classic" && "bg-accent text-on-accent",
            club.template === "bold" && "bg-accent text-on-accent",
            club.template === "minimal" && "border-b-[3px] border-accent bg-white text-ink",
          )}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <Link to={base} className="flex min-w-0 items-center gap-2.5">
              <Crest club={club} className="h-9 w-9" />
              <div className="min-w-0 leading-tight">
                <p className="truncate font-bold">{club.name} Locker</p>
                <p className="truncate text-xs opacity-75">Pre-loved shirts from fans</p>
              </div>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm font-medium">
              <a className="hidden items-center gap-1 rounded-full px-3 py-1.5 opacity-80 hover:opacity-100 sm:flex">
                Club shop <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => setSellOpen(true)}
                className={clsx(
                  "rounded-full px-3.5 py-1.5 font-semibold",
                  club.template === "minimal" ? "bg-accent text-on-accent" : "bg-white/15 hover:bg-white/25",
                )}
              >
                Sell yours
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>

        <footer className="border-t border-neutral-100 bg-neutral-50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-xs text-neutral-500 sm:px-6">
            <span className="flex items-center gap-1.5">
              Run by <LockerLogo className="text-xs" />
            </span>
            <span>Every shirt checked by KitLegit</span>
            <span>Money held until delivery</span>
            <span className="ml-auto">Terms · Privacy · Help</span>
          </div>
        </footer>

        {!embedded && (
          <div className="fixed bottom-3 left-3 z-20 flex items-center gap-2 rounded-full bg-ink/90 px-3 py-1.5 text-[11px] text-white shadow-lg">
            <span className="font-semibold text-amber-300">Prototype</span>
            <span className="hidden sm:inline">simulating {club.domain}</span>
            <Link to="/" className="font-semibold underline">
              All surfaces
            </Link>
          </div>
        )}

        {sellOpen && <SellInAppDialog club={club} onClose={() => setSellOpen(false)} />}
      </div>
    </ClubContext.Provider>
  );
}

function SellInAppDialog({ club, onClose }: { club: Club; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1 hover:bg-neutral-100" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <LockerLogo className="text-base" />
        <h2 className="text-xl font-bold">Sell your {club.name} shirt</h2>
        <p className="text-sm text-neutral-600">
          Selling happens in The Locker app, where KitLegit checks your shirt. It's free, and it shows up here once
          it passes.
        </p>
        <p className="rounded-2xl bg-accent/10 p-3 text-sm font-semibold text-accent">
          Get 110% back as {club.name} shop credit
        </p>
        <QrCode seed={`app-${club.id}`} className="mx-auto h-32 w-32" />
        <Link to="/app/sell" target="_top">
          <Button block className="mt-1">
            Open The Locker app
          </Button>
        </Link>
      </div>
    </div>
  );
}
