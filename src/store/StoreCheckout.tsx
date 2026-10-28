import { useNavigate, useParams } from "react-router-dom";
import { CheckoutForm } from "../components/CheckoutForm";
import { LockerLogo } from "../components/ui";
import { useLocker } from "../lib/store";
import { useClub } from "./StoreLayout";

export function StoreCheckout() {
  const { id } = useParams();
  const club = useClub();
  const s = useLocker();
  const navigate = useNavigate();
  const listing = s.listings.find((l) => l.id === id);
  if (!listing) return null;
  const buyer = s.users[s.storeBuyerId];

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-2xl font-bold">Checkout</h1>
      <CheckoutForm
        listing={listing}
        buyerId={buyer.id}
        channel="club"
        clubId={club.id}
        header={
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200 p-3 text-sm">
            <div>
              <p className="font-semibold">{buyer.name}</p>
              <p className="text-xs text-neutral-500">
                Signed in with <LockerLogo className="text-xs" />
              </p>
            </div>
            <span className="text-xs font-semibold text-accent">Not you?</span>
          </div>
        }
        onPlaced={(orderId) => navigate(`/store/${club.id}/order/${orderId}`, { replace: true })}
      />
    </div>
  );
}
