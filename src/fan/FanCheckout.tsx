import { useNavigate, useParams } from "react-router-dom";
import { CheckoutForm } from "../components/CheckoutForm";
import { BackHeader } from "../components/ui";
import { useLocker } from "../lib/store";
import type { Listing } from "../lib/types";

export function FanCheckout() {
  const { id } = useParams();
  const s = useLocker();
  const navigate = useNavigate();
  const listings = (id ?? "").split(",").map((x) => s.listings.find((l) => l.id === x)).filter((l) => l && l.status === "live") as Listing[];
  if (listings.length === 0) return <BackHeader title="Not available any more" />;

  return (
    <div className="pb-6">
      <BackHeader title="Checkout" />
      <div className="px-4">
        <CheckoutForm
          listings={listings}
          buyerId={s.meId}
          channel="app"
          onPlaced={(orderId) => navigate(`/app/orders/${orderId}`, { replace: true })}
        />
      </div>
    </div>
  );
}
