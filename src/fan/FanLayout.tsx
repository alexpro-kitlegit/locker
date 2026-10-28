import clsx from "clsx";
import { Home, PlusCircle, Search, User, Wallet } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LockerLogo, PoweredByKitLegit } from "../components/ui";
import { useLocker } from "../lib/store";
import { unreviewed } from "../lib/wallet";

const TABS = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/search", label: "Search", icon: Search },
  { to: "/app/sell", label: "Sell", icon: PlusCircle },
  { to: "/app/wallet", label: "Wallet", icon: Wallet },
  { to: "/app/me", label: "Me", icon: User },
];

/** Draws a phone on wide screens when opened directly. Full-bleed on phones and inside the demo iframe. */
function usePhoneFrame() {
  const query = "(min-width: 640px)";
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide && window.self === window.top;
}

export function FanLayout() {
  const framed = usePhoneFrame();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const s = useLocker();
  const walletAlert = unreviewed(s, s.meId).length > 0 || s.orders.some((o) => o.sellerId === s.meId && o.status === "paid");

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname]);

  const screen = (
    <div className="flex h-full flex-col bg-white">
      {framed && <StatusBar />}
      <header className="flex items-center justify-between px-4 py-2.5">
        <Link to="/app">
          <LockerLogo className="text-sm" />
        </Link>
        <PoweredByKitLegit />
      </header>
      <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <nav className="grid grid-cols-5 border-t border-neutral-100 bg-white pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx("relative flex flex-col items-center gap-0.5 text-[10px] font-medium", isActive ? "text-locker" : "text-neutral-400")
            }
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} />
            {label}
            {label === "Wallet" && walletAlert && <span className="absolute right-[30%] top-0 h-2 w-2 rounded-full bg-red-500" />}
          </NavLink>
        ))}
      </nav>
    </div>
  );

  if (!framed) return <div className="h-[100dvh]">{screen}</div>;

  return (
    <div className="flex min-h-screen items-center justify-center gap-12 bg-neutral-100 p-6">
      <PhoneFrame>{screen}</PhoneFrame>
      <aside className="hidden max-w-xs space-y-3 text-sm text-neutral-600 lg:block">
        <LockerLogo className="text-lg" />
        <p>
          The fan app. Sell a shirt (KitLegit checks it here), buy from any club, and choose how you get paid.
        </p>
        <p className="text-xs text-neutral-500">Prototype: no backend. Data lives in this browser.</p>
        <div className="flex gap-3 pt-2">
          <Link to="/" className="font-semibold text-locker">
            ← All surfaces
          </Link>
          <Link to="/demo" className="font-semibold text-locker">
            Side-by-side demo
          </Link>
        </div>
      </aside>
    </div>
  );
}

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[min(844px,calc(100vh-48px))] w-[390px] shrink-0 rounded-[56px] border-[11px] border-neutral-900 bg-neutral-900 shadow-2xl">
      <div className="absolute left-1/2 top-2.5 z-10 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
      <div className="h-full overflow-hidden rounded-[45px]">{children}</div>
    </div>
  );
}

export function StatusBar() {
  return (
    <div className="flex h-11 shrink-0 items-end justify-between px-8 pb-1 text-[13px] font-semibold">
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <span className="flex items-end gap-[2px]">
          {[4, 6, 8, 10].map((h) => (
            <span key={h} className="w-[3px] rounded-sm bg-ink" style={{ height: h }} />
          ))}
        </span>
        <span className="ml-1 h-[11px] w-[22px] rounded-[3px] border border-ink p-[1px]">
          <span className="block h-full w-3/4 rounded-[1px] bg-ink" />
        </span>
      </span>
    </div>
  );
}
