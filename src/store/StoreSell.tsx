import { Navigate, useNavigate, useParams } from "react-router-dom";
import { SellFlow } from "../components/sell/SellFlow";
import { SellStart } from "../components/sell/SellStart";
import { storeRoutes } from "../lib/routes";
import { useStore } from "./StoreLayout";

/** /store/:club/sell: onboarding first if needed, then the same choices as the app. */
export function StoreSellStart() {
  const { club, user } = useStore();
  if (!user) return <Navigate to={`/store/${club.id}`} replace />;
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <SellStart userId={user.id} routes={storeRoutes(club.id)} startedOn={{ surface: "store", clubId: club.id }} draftHref={(id) => `/store/${club.id}/sell/${id}`} />
    </div>
  );
}

export function StoreSell() {
  const { draftId } = useParams();
  const { club, user } = useStore();
  const navigate = useNavigate();
  if (!user || !draftId) return <Navigate to={`/store/${club.id}`} replace />;

  return (
    <SellFlow
      key={draftId}
      draftId={draftId}
      surface="store"
      storeClub={club}
      listingHref={(id) => `/store/${club.id}/account?listing=${id}`}
      accountHref={`/store/${club.id}/account`}
      exitHref={`/store/${club.id}/account`}
      onSellAnother={() => navigate(`/store/${club.id}/sell`)}
    />
  );
}
