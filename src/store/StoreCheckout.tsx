import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CheckoutForm } from "../components/CheckoutForm";
import { Button, LockerLogo } from "../components/ui";
import { useLocker } from "../lib/store";
import { useStore } from "./StoreLayout";

export function StoreCheckout() {
  const { id } = useParams();
  const { club, user, requireSignIn } = useStore();
  const s = useLocker();
  const navigate = useNavigate();
  const listing = s.listings.find((l) => l.id === id);
  if (!listing) return null;
  if (user && listing.sellerId === user.id) return <Navigate to={`/store/${club.id}/item/${listing.id}`} replace />;

  if (!user)
    return (
      <div className="mx-auto max-w-sm space-y-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Sign in to buy</h1>
        <p className="text-sm text-neutral-500">So we can keep you posted on delivery and move the certificate to you.</p>
        <Button block onClick={() => requireSignIn()}>
          Sign in
        </Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-2xl font-bold">Checkout</h1>
      <CheckoutForm
        listing={listing}
        buyerId={user.id}
        channel="club"
        clubId={club.id}
        header={
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200 p-3 text-sm">
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="flex items-center gap-1 text-xs text-neutral-500">
                {club.accountMethod === "locker" ? "Signed in with" : `${club.accountName}, linked to`} <LockerLogo className="text-xs" />
              </p>
            </div>
          </div>
        }
        onPlaced={(orderId) => navigate(`/store/${club.id}/order/${orderId}`, { replace: true })}
      />
    </div>
  );
}
