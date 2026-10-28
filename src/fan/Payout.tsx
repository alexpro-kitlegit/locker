import { useParams } from "react-router-dom";
import { PayoutChooser } from "../components/PayoutChooser";
import { BackHeader } from "../components/ui";
import { useLocker } from "../lib/store";

export function Payout() {
  const { id } = useParams();
  const s = useLocker();
  const order = s.orders.find((o) => o.id === id);
  if (!order) return <BackHeader title="Order not found" />;

  return (
    <div className="px-4 pb-6 pt-3">
      <PayoutChooser order={order} doneHref="/app/wallet" doneLabel="Go to wallet" />
    </div>
  );
}
