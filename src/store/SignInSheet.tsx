import { Mail, X } from "lucide-react";
import { useState } from "react";
import { Button, Crest, LockerLogo } from "../components/ui";
import { setStoreUser } from "../lib/actions";
import { useLocker } from "../lib/store";
import type { Club } from "../lib/types";

/**
 * Sign-in on a club store. Every route ends in one Locker account (needed for payouts, ID checks,
 * the wallet and HMRC reporting). Where the club already has accounts, the fan never sees a sign-up:
 * - Shopify clubs: the fan's Shopify customer account is linked to a Locker account on first use.
 * - Clubs with their own login (SSO): "Continue with Rovers ID" links it the same way.
 * - Otherwise: a Locker account with an email code, styled in club colours.
 */
export function SignInSheet({ club, onClose, onSignedIn }: { club: Club; onClose: () => void; onSignedIn: () => void }) {
  const s = useLocker();
  const [persona, setPersona] = useState("u-sam");
  const [emailMode, setEmailMode] = useState(club.accountMethod === "locker");
  const user = s.users[persona];

  const signIn = () => {
    setStoreUser(persona);
    onSignedIn();
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm space-y-5 rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1 hover:bg-neutral-100" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center gap-2 text-center">
          <Crest club={club} className="h-12 w-12" />
          <h2 className="text-xl font-bold">Sign in to the {club.name} Locker</h2>
          <p className="text-sm text-neutral-500">To buy, sell and get paid.</p>
        </div>

        {!emailMode && club.accountMethod !== "locker" ? (
          <div className="space-y-2">
            <Button block onClick={signIn}>
              Continue with your {club.accountName}
            </Button>
            <p className="text-center text-xs text-neutral-500">
              {club.accountMethod === "shopify"
                ? `You're signed in on ${club.shopDomain} as ${user.email}.`
                : `Uses the login you already have for tickets and the club shop.`}
            </p>
            <button onClick={() => setEmailMode(true)} className="block w-full text-center text-sm font-semibold text-neutral-500">
              Use email instead
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm">
              <Mail className="h-4 w-4 text-neutral-400" />
              <input readOnly value={user.email} className="flex-1 bg-transparent outline-none" />
            </label>
            <Button block onClick={signIn}>
              Email me a code
            </Button>
            <p className="text-center text-xs text-neutral-500">Prototype: the code step is skipped.</p>
          </div>
        )}

        <p className="flex flex-wrap items-center justify-center gap-1 border-t border-neutral-100 pt-4 text-center text-xs text-neutral-500">
          One account for every club's Locker and the <LockerLogo className="text-xs" /> app.
        </p>

        <div className="rounded-2xl border border-dashed border-amber-400 bg-amber-50 p-3 text-xs">
          <p className="mb-1.5 font-semibold uppercase tracking-wide text-amber-700">Prototype: sign in as</p>
          <select value={persona} onChange={(e) => setPersona(e.target.value)} className="w-full rounded-lg border border-amber-300 bg-white px-2 py-1">
            <option value="u-sam">Sam Carter (seller, same account as the app)</option>
            <option value="u-jordan">Jordan Ellis (buyer)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
