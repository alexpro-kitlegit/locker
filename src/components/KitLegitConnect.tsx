import { Check, Link2, X } from "lucide-react";
import { useState } from "react";
import { connectKitLegit, disconnectKitLegit } from "../lib/actions";
import { formatDate } from "../lib/format";
import { useLocker } from "../lib/store";
import { Sheet } from "./sell/Sheet";
import { Button } from "./ui";

export function KitLegitMark({ className = "h-9 w-9" }: { className?: string }) {
  return <span className={`grid shrink-0 place-items-center rounded-xl bg-ink text-xs font-black text-white ${className}`}>KL</span>;
}

/**
 * Connect KitLegit, like linking Google apps: one consent, then The Locker can read the fan's checks.
 * One way only: KitLegit accounts can connect to (or sign in to) The Locker; a Locker account never makes a KitLegit one.
 */
export function KitLegitConnect({ userId, compact }: { userId: string; compact?: boolean }) {
  const s = useLocker();
  const kl = s.users[userId].kitlegit;
  const [open, setOpen] = useState(false);
  const checks = s.kitlegit.filter((r) => r.userId === userId).length;

  if (kl?.connectedAt)
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3">
        <KitLegitMark />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">KitLegit · @{kl.username}</p>
          <p className="text-xs text-neutral-500">
            Connected {formatDate(kl.connectedAt)} · {checks} {checks === 1 ? "check" : "checks"}
          </p>
        </div>
        <button onClick={() => disconnectKitLegit(userId)} className="text-xs font-semibold text-neutral-500 underline">
          Disconnect
        </button>
      </div>
    );

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3">
        <KitLegitMark />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">{compact ? "Checked shirts on KitLegit?" : "Connect KitLegit"}</p>
          <p className="text-xs text-neutral-500">List shirts you've already checked, without checking them again.</p>
        </div>
        <Button className="shrink-0 px-3 py-1.5" variant="secondary" onClick={() => setOpen(true)}>
          <Link2 className="h-4 w-4" /> Connect
        </Button>
      </div>
      {open && <ConnectSheet userId={userId} onClose={() => setOpen(false)} />}
    </>
  );
}

function ConnectSheet({ userId, onClose }: { userId: string; onClose: () => void }) {
  const s = useLocker();
  const u = s.users[userId];
  const kl = u.kitlegit;

  return (
    <Sheet
      eyebrow="KitLegit"
      title={kl ? "Connect KitLegit to The Locker?" : "No KitLegit account found"}
      sub={kl ? `Signed in to KitLegit as @${kl.username}` : `We couldn't find a KitLegit account for ${u.email}.`}
      top={<KitLegitMark className="h-12 w-12 text-base" />}
      onClose={onClose}
    >
      {kl ? (
        <div className="space-y-4">
          <div className="space-y-2 rounded-2xl bg-neutral-50 p-4 text-sm">
            <p className="font-semibold">The Locker will be able to:</p>
            <Perm ok>See your checks, results and certificates</Perm>
            <Perm ok>See your KitLegit username</Perm>
            <p className="pt-2 font-semibold">It won't:</p>
            <Perm>Change or delete your checks</Perm>
            <Perm>See your tokens or subscription</Perm>
            <Perm>Post anything on KitLegit</Perm>
          </div>
          <p className="text-xs text-neutral-500">
            When a shirt you listed from KitLegit sells, its certificate moves to the buyer in KitLegit too. You can disconnect at any time.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                connectKitLegit(userId);
                onClose();
              }}
            >
              Allow
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Your Locker account doesn't come with a KitLegit one. Check a shirt in the KitLegit app first, then connect it here. Or just sell: every Locker
            listing is checked anyway.
          </p>
          <Button block variant="secondary" onClick={onClose}>
            OK
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function Perm({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-neutral-700">
      {ok ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-neutral-400" />}
      {ok ? children : <span className="text-neutral-500">{children}</span>}
    </p>
  );
}
