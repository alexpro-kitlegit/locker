import { MoveMoney } from "../components/MoveMoney";
import { BackHeader } from "../components/ui";
import { useLocker } from "../lib/store";

export function WalletMovePage() {
  const s = useLocker();
  return (
    <div className="pb-6">
      <BackHeader />
      <div className="px-4">
        <MoveMoney userId={s.meId} doneHref="/app/wallet" doneLabel="Back to wallet" />
      </div>
    </div>
  );
}
