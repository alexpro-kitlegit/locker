import { Navigate, useParams } from "react-router-dom";
import { PayoutChooser } from "../components/PayoutChooser";
import { useLocker } from "../lib/store";
import { useStore } from "./StoreLayout";

export function StorePayout() {
  const { orderId } = useParams();
  const { club, user } = useStore();
  const s = useLocker();
  const order = s.orders.find((o) => o.id === orderId);
  if (!user || !order || order.sellerId !== user.id) return <Navigate to={`/store/${club.id}`} replace />;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <PayoutChooser order={order} doneHref={`/store/${club.id}/account`} doneLabel="Back to your account" />
    </div>
  );
}
