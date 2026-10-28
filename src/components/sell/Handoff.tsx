import { Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { QrCode } from "../QrCode";

/** Continue a draft on the phone: App Clip (no install) or The Locker app, same account, same draft. */
export function Handoff({ draftId, title, text }: { draftId: string; title: string; text: string }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-neutral-200 p-4">
      <QrCode seed={draftId} className="h-24 w-24 shrink-0" />
      <div className="min-w-0 space-y-1.5 text-sm">
        <p className="flex items-center gap-1.5 font-semibold">
          <Smartphone className="h-4 w-4 text-accent" /> {title}
        </p>
        <p className="text-neutral-600">{text}</p>
        <p className="text-xs text-neutral-500">
          Opens instantly with an App Clip, no download needed. If you have The Locker app, it opens there.
        </p>
        <Link to={`/app/sell/${draftId}`} target="_top" className="inline-block text-xs font-semibold text-amber-700 underline">
          Prototype: open on this device
        </Link>
      </div>
    </div>
  );
}
