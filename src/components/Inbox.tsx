import clsx from "clsx";
import { Bell, ChevronLeft, MessageCircle, Send, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { markNotificationsRead, makeOffer, respondToOffer, sendMessage } from "../lib/actions";
import { formatDateTime, shirtTitle } from "../lib/format";
import { allInPrice, formatGBP } from "../lib/pricing";
import { useLocker } from "../lib/store";
import { isAppLink, linkHref, type SurfaceRoutes } from "../lib/routes";
import type { Conversation } from "../lib/types";
import { ShirtTile } from "./ListingCard";
import { Button } from "./ui";

/** Notifications and message threads for one account. Shared by The Locker app and club stores. */
export function Inbox({ userId, routes, initialTab = "notifications" }: { userId: string; routes: SurfaceRoutes; initialTab?: "notifications" | "messages" }) {
  const s = useLocker();
  const [tab, setTab] = useState(initialTab);
  const notes = s.notifications.filter((n) => n.userId === userId);
  const threads = s.conversations
    .filter((c) => c.buyerId === userId || c.sellerId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  // Opening the inbox marks notifications as read (after a moment, so the unread dots are seen).
  useEffect(() => {
    const t = setTimeout(() => markNotificationsRead(userId), 1500);
    return () => clearTimeout(t);
  }, [userId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-full bg-neutral-100 p-1 text-sm font-semibold">
        {(["notifications", "messages"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={clsx("rounded-full py-1.5", tab === t && "bg-white shadow-sm")}>
            {t === "notifications" ? "Notifications" : `Messages${threads.length ? ` (${threads.length})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "notifications" ? (
        notes.length === 0 ? (
          <Empty icon={<Bell className="h-6 w-6" />} text="Nothing yet. We'll let you know when something happens." />
        ) : (
          <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
            {notes.map((n) => {
              const href = linkHref(routes, n.link, userId);
              return (
                <Link key={n.id} to={href} target={routes.surface === "store" && isAppLink(href) ? "_top" : undefined} className="flex gap-3 px-4 py-3">
                  <span className={clsx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {n.body && <p className="text-xs text-neutral-500">{n.body}</p>}
                    <p className="mt-0.5 text-[11px] text-neutral-400">{formatDateTime(n.at)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : threads.length === 0 ? (
        <Empty icon={<MessageCircle className="h-6 w-6" />} text="No messages yet. Ask a seller a question or make an offer on a shirt." />
      ) : (
        <div className="space-y-2">
          {threads.map((c) => (
            <ThreadRow key={c.id} c={c} userId={userId} to={routes.conversation(c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ThreadRow({ c, userId, to }: { c: Conversation; userId: string; to: string }) {
  const s = useLocker();
  const listing = s.listings.find((l) => l.id === c.listingId)!;
  const other = s.users[c.buyerId === userId ? c.sellerId : c.buyerId];
  const last = c.messages[c.messages.length - 1];
  const waiting = c.offer?.status === "pending" && c.offer.by !== userId;
  return (
    <Link to={to} className={clsx("flex items-center gap-3 rounded-2xl border p-2.5", waiting ? "border-accent bg-accent/5" : "border-neutral-200")}>
      <ShirtTile listing={listing} compact className="w-12 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {other.name} · {shirtTitle(listing)}
        </p>
        <p className={clsx("truncate text-xs", waiting ? "font-semibold text-accent" : "text-neutral-500")}>
          {waiting ? `Offer of ${formatGBP(c.offer!.amount)} waiting for you` : last?.kind === "offer" ? `Offer: ${formatGBP(last.amount!)}` : (last?.text ?? "No messages yet")}
        </p>
      </div>
    </Link>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-neutral-50 p-8 text-center text-sm text-neutral-500">
      {icon}
      {text}
    </div>
  );
}

const QUICK_QUESTIONS = ["Any marks or pulls?", "Player or stadium version?", "Can you send measurements?", "Is the price negotiable?"];

/**
 * One thread about one listing. Questions and offers live together (as on Vinted). The seller can accept,
 * decline or counter an offer; the buyer can accept or decline a counter. AI-style guardrails block contact
 * details and payment outside The Locker.
 */
export function ConversationView({ convId, userId, routes }: { convId: string; userId: string; routes: SurfaceRoutes }) {
  const s = useLocker();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [blocked, setBlocked] = useState<string | null>(null);
  const [offering, setOffering] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const c = s.conversations.find((x) => x.id === convId);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [c?.messages.length]);

  if (!c) return <p className="text-sm text-neutral-500">This conversation isn't available.</p>;
  const listing = s.listings.find((l) => l.id === c.listingId)!;
  const isSeller = userId === c.sellerId;
  const other = s.users[isSeller ? c.buyerId : c.sellerId];
  const offer = c.offer;
  const toAnswer = offer?.status === "pending" && offer.by !== userId;
  const canOffer = listing.status === "live" && offer?.status !== "accepted";

  const send = (t: string) => {
    if (!t.trim()) return;
    const err = sendMessage(c.id, userId, t.trim());
    setBlocked(err);
    if (!err) setText("");
  };

  return (
    <div className="flex flex-col gap-3">
      <button onClick={() => navigate(routes.inbox)} className="flex items-center gap-1 self-start text-sm font-medium text-neutral-500">
        <ChevronLeft className="h-4 w-4" /> Inbox
      </button>

      <Link to={routes.listing(listing.id, listing.clubId)} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-2.5">
        <ShirtTile listing={listing} compact className="w-12 shrink-0" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="truncate font-semibold">
            {shirtTitle(listing)} · {listing.size}
          </p>
          <p className="text-xs text-neutral-500">
            {formatGBP(listing.price)} · with {other.name}
          </p>
        </div>
      </Link>

      <div className="space-y-2">
        {c.messages.map((m) => {
          const mine = m.from === userId;
          if (m.kind === "system") return <p key={m.id} className="text-center text-xs font-medium text-neutral-500">{m.text}</p>;
          return (
            <div key={m.id} className={clsx("flex", mine ? "justify-end" : "justify-start")}>
              <div className={clsx("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm", mine ? "bg-accent text-on-accent" : "bg-neutral-100")}>
                {m.kind === "offer" ? (
                  <>
                    <p className="text-[11px] font-semibold uppercase opacity-70">{m.from === c.sellerId ? "Counter offer" : "Offer"}</p>
                    <p className="text-lg font-bold">{formatGBP(m.amount!)}</p>
                  </>
                ) : (
                  m.text
                )}
                <p className="mt-0.5 text-[10px] opacity-60">{formatDateTime(m.at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>

      {toAnswer && (
        <div className="space-y-2 rounded-2xl border border-accent bg-accent/5 p-3">
          <p className="text-sm font-semibold">
            {other.name.split(" ")[0]} {isSeller ? "offered" : "countered with"} {formatGBP(offer!.amount)}
            {isSeller && <span className="font-normal text-neutral-500"> (you'd get {formatGBP(offer!.amount)} instead of {formatGBP(listing.price)})</span>}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={() => respondToOffer(c.id, userId, true)}>Accept</Button>
            <Button variant="secondary" onClick={() => respondToOffer(c.id, userId, false)}>
              Decline
            </Button>
            {isSeller && (
              <Button variant="secondary" onClick={() => setOffering(true)}>
                Counter
              </Button>
            )}
          </div>
        </div>
      )}

      {offer?.status === "accepted" && !isSeller && listing.status === "live" && (
        <div className="space-y-2 rounded-2xl bg-ink p-4 text-white">
          <p className="font-semibold">Offer accepted: {formatGBP(offer.amount)}</p>
          <p className="text-xs text-white/70">It's held for you for 24 hours. You pay {formatGBP(allInPrice(offer.amount))} including buyer protection, plus postage.</p>
          <Link to={routes.checkout([listing.id])}>
            <Button block className="bg-white text-ink">
              Buy it now
            </Button>
          </Link>
        </div>
      )}

      {offering && <OfferComposer listingPrice={listing.price} counter={isSeller} onCancel={() => setOffering(false)} onSend={(a) => { makeOffer(c.id, userId, a); setOffering(false); }} />}

      {blocked && (
        <p className="flex gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-700">
          <ShieldAlert className="h-4 w-4 shrink-0" /> {blocked}
        </p>
      )}

      {!isSeller && c.messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUESTIONS.map((q) => (
            <button key={q} onClick={() => send(q)} className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isSeller && canOffer && !offering && (
          <button onClick={() => setOffering(true)} className="shrink-0 rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold">
            Make an offer
          </button>
        )}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(text)}
          placeholder="Write a message"
          className="min-w-0 flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-accent"
        />
        <button onClick={() => send(text)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-on-accent" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="text-center text-[11px] text-neutral-400">Keep chat and payment in The Locker. That's how you're protected.</p>
    </div>
  );
}

/** Offer or counter: quick amounts below the price, or type one. */
export function OfferComposer({ listingPrice, counter, onSend, onCancel }: { listingPrice: number; counter?: boolean; onSend: (amount: number) => void; onCancel: () => void }) {
  const [text, setText] = useState((Math.round(listingPrice * 0.9) / 100).toFixed(2));
  const amount = Math.round(parseFloat(text || "0") * 100);
  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 p-4">
      <p className="text-sm font-semibold">{counter ? "Counter offer" : "Make an offer"}</p>
      <div className="flex gap-2">
        {[0.95, 0.9, 0.85].map((f) => (
          <button key={f} onClick={() => setText((Math.round(listingPrice * f) / 100).toFixed(2))} className="flex-1 rounded-xl border border-neutral-200 py-2 text-sm">
            {formatGBP(Math.round(listingPrice * f))}
            <span className="block text-[10px] text-neutral-500">−{Math.round((1 - f) * 100)}%</span>
          </button>
        ))}
      </div>
      <label className="flex items-baseline gap-1 border-b-2 border-ink pb-1">
        <span className="text-2xl font-bold">£</span>
        <input value={text} onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" className="w-full bg-transparent text-2xl font-bold outline-none" />
      </label>
      <p className="text-xs text-neutral-500">Listed at {formatGBP(listingPrice)}. {counter ? "" : "The seller has 48 hours to answer."}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={amount <= 0 || amount >= listingPrice} onClick={() => onSend(amount)}>
          Send offer
        </Button>
      </div>
    </div>
  );
}
