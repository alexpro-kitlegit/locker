import { useNavigate, useParams } from "react-router-dom";
import { CheckoutForm } from "../components/CheckoutForm";
import { BackHeader } from "../components/ui";
import { useLocker } from "../lib/store";

export function FanCheckout() {
  const { id } = useParams();
  const s = useLocker();
  const navigate = useNavigate();
  const listing = s.listings.find((l) => l.id === id);
  if (!listing) return <BackHeader title="Listing not found" />;

  return (
    <div className="pb-6">
      <BackHeader title="Checkout" />
      <div className="px-4">
        <CheckoutForm
          listing={listing}
          buyerId={s.meId}
          channel="app"
          onPlaced={(orderId) => navigate(`/app/orders/${orderId}`, { replace: true })}
        />
      </div>
    </div>
  );
}
