import clsx from "clsx";
import { Camera, Loader2, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QrCode } from "../components/QrCode";
import { ShirtArt } from "../components/ShirtArt";
import { BackHeader, Button, PoweredByKitLegit, Row } from "../components/ui";
import { getClub } from "../data/clubs";
import { dispatchOrder, newCheckId } from "../lib/actions";
import { CARRIERS } from "../lib/pricing";
import { useLocker } from "../lib/store";

type Step = "photos" | "checking" | "matched";

/** The dispatch check: KitLegit confirms the shirt going in the parcel is the one it checked at listing. */
export function Dispatch() {
  const { id } = useParams();
  const s = useLocker();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("photos");
  const [photos, setPhotos] = useState({ front: false, wash: false });
  const [checkId] = useState(newCheckId);

  useEffect(() => {
    if (step !== "checking") return;
    const t = setTimeout(() => setStep("matched"), 2200);
    return () => clearTimeout(t);
  }, [step]);

  const order = s.orders.find((o) => o.id === id);
  if (!order) return <BackHeader title="Order not found" />;
  const listing = s.listings.find((l) => l.id === order.listingId)!;
  const kit = getClub(listing.clubId)!.kits[listing.type];

  if (step === "photos")
    return (
      <div className="pb-6">
        <BackHeader title="Send it" />
        <div className="space-y-5 px-4">
          <div>
            <h1 className="text-xl font-bold">Quick dispatch check</h1>
            <p className="text-sm text-neutral-500">
              Two photos so KitLegit can confirm it's the same shirt you listed. It protects you if the buyer says
              otherwise.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["front", "wash"] as const).map((slot) => (
              <button
                key={slot}
                onClick={() => setPhotos((p) => ({ ...p, [slot]: true }))}
                className={clsx(
                  "flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl text-sm font-medium",
                  photos[slot] ? "bg-tile" : "border-2 border-dashed border-neutral-200 text-neutral-500",
                )}
              >
                {photos[slot] ? (
                  slot === "front" ? <ShirtArt kit={kit} className="h-20 w-20" /> : <Tag className="h-10 w-10 text-neutral-500" strokeWidth={1.4} />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
                {slot === "front" ? "Front" : "Wash label"}
              </button>
            ))}
          </div>
          <Button block disabled={!photos.front || !photos.wash} onClick={() => setStep("checking")}>
            Check and get my QR code
          </Button>
        </div>
      </div>
    );

  if (step === "checking")
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <Loader2 className="h-10 w-10 animate-spin" />
        <PoweredByKitLegit />
        <p className="font-semibold">Matching to certificate {listing.check.certificate}</p>
      </div>
    );

  return (
    <div className="pb-6">
      <BackHeader title="Send it" />
      <div className="space-y-5 px-4">
        <div className="rounded-2xl border border-neutral-200 px-4">
          <Row label="Same shirt as listed" value="Matched" tick />
          <Row label="Dispatch check" value={checkId} />
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-neutral-50 p-5 text-center">
          <QrCode seed={order.id} className="h-44 w-44" />
          <p className="font-semibold">Show this at the {CARRIERS[order.carrier].name} point</p>
          <p className="text-xs text-neutral-500">{order.dropOff}. No printer, no label.</p>
        </div>
        <Button
          block
          onClick={() => {
            dispatchOrder(order.id, checkId);
            navigate(`/app/orders/${order.id}`, { replace: true });
          }}
        >
          I've dropped it off
        </Button>
      </div>
    </div>
  );
}
