import { AlertTriangle, Info } from "lucide-react";
import { useEffect, useState } from "react";

// Minimal stand-in for KitLegit's toasts ("Sentence one. Sentence two." = bold title + lighter subtext).
type Toast = { id: number; title: string; body?: string; warn: boolean };
let listeners: ((t: Toast) => void)[] = [];
let next = 1;

export function toast(message: string, opts: { warn?: boolean; body?: string } = {}) {
  const t = { id: next++, title: message, body: opts.body, warn: opts.warn ?? true };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const on = (t: Toast) => {
      setToasts((ts) => [...ts, t]);
      setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), 4500);
    };
    listeners.push(on);
    return () => {
      listeners = listeners.filter((l) => l !== on);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex max-w-sm gap-2 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-xl">
          {t.warn ? <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" /> : <Info className="h-4 w-4 shrink-0" />}
          <div>
            <p className="font-semibold">{t.title}</p>
            {t.body && <p className="text-white/70">{t.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
