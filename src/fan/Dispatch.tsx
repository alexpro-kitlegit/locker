import { Download, MapPin, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { QrCode } from "../components/QrCode";
import { BackHeader, Button, DemoButton, PrototypeControls } from "../components/ui";
import { dispatchOrder, resendLabel } from "../lib/actions";
import { useState } from "react";
import { sendBy, shirtTitle } from "../lib/format";
import { CARRIERS, PRINT_ONLY } from "../lib/pricing";
import { useLocker } from "../lib/store";
import type { Order, User } from "../lib/types";

/**
 * The shipping label, created by ShipStation when the buyer paid, for the carrier the buyer chose.
 * No checks on the seller's side: the seller shows the QR code at drop-off, or prints the label.
 */
export function Dispatch() {
  const { id } = useParams();
  const s = useLocker();
  const navigate = useNavigate();
  const [resent, setResent] = useState(false);
  const order = s.orders.find((o) => o.id === id);
  if (!order) return <BackHeader title="Order not found" />;

  const listing = s.listings.find((l) => l.id === order.listingId)!;
  const seller = s.users[order.sellerId];
  const buyer = s.users[order.buyerId];
  const carrier = CARRIERS[order.carrier];
  const printOnly = PRINT_ONLY.includes(order.carrier);

  return (
    <div className="pb-6">
      <BackHeader title="Your label" />
      <div className="space-y-5 px-4">
        <div>
          <h1 className="text-xl font-bold">Send it by {sendBy(order.createdAt)}</h1>
          <p className="text-sm text-neutral-500">
            {shirtTitle(listing)} · {carrier.name}. We've emailed the label to {seller.email} too.
          </p>
        </div>

        {printOnly ? (
          <div className="space-y-2 rounded-2xl bg-neutral-50 p-5 text-center">
            <Printer className="mx-auto h-10 w-10 text-neutral-400" />
            <p className="font-semibold">{carrier.name} needs a printed label</p>
            <p className="text-xs text-neutral-500">Print it and stick it on the parcel. No printer? Turn on "I don't have a printer" in Me, and buyers won't see {carrier.name}.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-neutral-50 p-5 text-center">
            <QrCode seed={order.id} className="h-44 w-44" />
            <p className="font-semibold">Show this at any {carrier.name} drop-off point</p>
            <p className="text-xs text-neutral-500">They print the label for you. No printer needed.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => printLabel(order, seller, buyer)}>
            <Printer className="h-4 w-4" /> Print label
          </Button>
          <Button variant="secondary" onClick={() => printLabel(order, seller, buyer)}>
            <Download className="h-4 w-4" /> Save as PDF
          </Button>
        </div>

        <button
          onClick={() => {
            resendLabel(order.id);
            setResent(true);
          }}
          className="block w-full text-center text-sm font-semibold text-locker"
        >
          {resent ? `Sent again to ${seller.email}` : "Email it to me again"}
        </button>

        <ol className="space-y-2 text-sm text-neutral-600">
          <li>1. Fold the shirt into a mailing bag{listing.nfcTag ? " with the FanNFC tag fixed on" : ""}.</li>
          <li>2. Take it to a {carrier.name} point and {printOnly ? "hand it over with the printed label on" : "show the QR code (or stick the printed label on)"}.</li>
          <li>3. That's it. We'll tell you when it's on its way.</li>
        </ol>

        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
          <MapPin className="h-3.5 w-3.5" /> Nearest: {order.dropOff}
        </p>

        <PrototypeControls title="Prototype: carrier scan at drop-off">
          <DemoButton
            onClick={() => {
              dispatchOrder(order.id);
              navigate(`/app/orders/${order.id}`, { replace: true });
            }}
          >
            Simulate: dropped off and scanned
          </DemoButton>
        </PrototypeControls>
      </div>
    </div>
  );
}

/** Prototype stand-in for ShipStation's PDF label: a printable page (print or save as PDF). */
function printLabel(order: Order, seller: User, buyer: User) {
  const w = window.open("", "_blank", "width=480,height=640");
  if (!w) return;
  w.document.write(`<!doctype html><title>Label ${order.id}</title>
<style>body{font-family:Inter,system-ui,sans-serif;padding:24px}.l{border:2px solid #000;padding:20px;max-width:380px}
h1{font-size:28px;margin:0 0 12px}.b{font-size:13px;line-height:1.5}.bar{height:60px;background:repeating-linear-gradient(90deg,#000 0 2px,#fff 2px 4px,#000 4px 7px,#fff 7px 9px);margin:16px 0}</style>
<div class="l"><h1>${CARRIERS[order.carrier].name}</h1>
<div class="b"><b>To:</b> ${buyer.name}<br>${order.dropOff}</div><br>
<div class="b"><b>From:</b> ${seller.name}, ${seller.city}</div>
<div class="bar"></div><div class="b">Order ${order.id} · The Locker · prototype label, not valid for postage</div></div>
<script>window.print()</script>`);
  w.document.close();
}
