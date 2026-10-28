import clsx from "clsx";
import { Bell, ExternalLink } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Crest, LockerLogo } from "../components/ui";
import { getClub } from "../data/clubs";
import { setStoreUser } from "../lib/actions";
import { accentVars, firstName } from "../lib/format";
import { useLocker } from "../lib/store";
import type { Club, User } from "../lib/types";
import { SignInSheet } from "./SignInSheet";

interface StoreContext {
  club: Club;
  user: User | null;
  /** Opens sign-in, then goes to `next` (defaults to staying put). */
  requireSignIn: (next?: string) => void;
}

const Ctx = createContext<StoreContext | null>(null);
export const useStore = () => useContext(Ctx)!;
export const useClub = () => useStore().club;

/** One store site for every partner club. The club (and so the theme) comes from the domain in production, the URL here. */
export function StoreLayout() {
  const { clubId } = useParams();
  const club = getClub(clubId);
  const s = useLocker();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [signInNext, setSignInNext] = useState<string | null>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  if (!club?.partner) return <Navigate to="/" replace />;

  const base = `/store/${club.id}`;
  const user = s.storeUserId ? s.users[s.storeUserId] : null;
  const unread = user ? s.notifications.filter((n) => n.userId === user.id && !n.read).length : 0;
  const embedded = window.self !== window.top;
  const requireSignIn = (next?: string) => {
    if (user) {
      if (next) navigate(next);
    } else setSignInNext(next ?? pathname);
  };

  return (
    <Ctx.Provider value={{ club, user, requireSignIn }}>
      <div style={accentVars(club.primary, club.secondary, club.onPrimary)} className="flex min-h-screen flex-col bg-white">
        <header className={clsx(club.template === "minimal" ? "border-b-[3px] border-accent bg-white text-ink" : "bg-accent text-on-accent")}>
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <Link to={base} className="flex min-w-0 items-center gap-2.5">
              <Crest club={club} className="h-9 w-9" />
              <div className="min-w-0 leading-tight">
                <p className="truncate font-bold">{club.name} Locker</p>
                <p className="truncate text-xs opacity-75">Pre-loved shirts from fans</p>
              </div>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm font-medium">
              <a className="hidden items-center gap-1 rounded-full px-3 py-1.5 opacity-80 hover:opacity-100 md:flex">
                Club shop <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => requireSignIn(`${base}/sell`)}
                className={clsx(
                  "rounded-full px-3.5 py-1.5 font-semibold",
                  club.template === "minimal" ? "bg-accent text-on-accent" : "bg-white text-accent hover:bg-white/90",
                )}
              >
                Sell yours
              </button>
              {user && (
                <Link to={`${base}/inbox`} className="relative ml-1 rounded-full p-1.5 hover:bg-black/10" aria-label="Inbox">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>
                  )}
                </Link>
              )}
              {user ? (
                <Link
                  to={`${base}/account`}
                  className={clsx(
                    "ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-3",
                    club.template === "minimal" ? "hover:bg-neutral-100" : "hover:bg-white/10",
                  )}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-2 text-xs font-bold text-ink">
                    {user.name.split(" ").map((p) => p[0]).join("")}
                  </span>
                  <span className="hidden sm:inline">{firstName(user.name)}</span>
                </Link>
              ) : (
                <button onClick={() => requireSignIn()} className="rounded-full px-3 py-1.5 opacity-90 hover:opacity-100">
                  Sign in
                </button>
              )}
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
            <span className="hidden sm:inline">simulating {club.domain} ·</span>
            <select
              value={s.storeUserId ?? ""}
              onChange={(e) => setStoreUser(e.target.value || null)}
              className="rounded bg-white/10 px-1 py-0.5 text-white"
            >
              <option value="">Signed out</option>
              <option value="u-sam">Sam (seller)</option>
              <option value="u-jordan">Jordan (buyer)</option>
            </select>
            <Link to="/" className="font-semibold underline">
              All surfaces
            </Link>
          </div>
        )}

        {signInNext !== null && (
          <SignInSheet
            club={club}
            onClose={() => setSignInNext(null)}
            onSignedIn={() => {
              const next = signInNext;
              setSignInNext(null);
              navigate(next);
            }}
          />
        )}
      </div>
    </Ctx.Provider>
  );
}
