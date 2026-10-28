import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { SellFlow } from "../components/sell/SellFlow";
import { createDraft } from "../lib/actions";
import { getState } from "../lib/store";
import { useStore } from "./StoreLayout";

/** /store/:club/sell: picks up an empty draft or starts one, then hands over to the draft route. */
export function StoreSellStart() {
  const { club, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const st = getState();
    const empty = st.drafts.find(
      (d) => d.ownerId === user.id && d.startedOn.clubId === club.id && d.pool.length === 0 && Object.keys(d.slots).length === 0,
    );
    const id = empty?.id ?? createDraft(user.id, { surface: "store", clubId: club.id });
    navigate(`/store/${club.id}/sell/${id}`, { replace: true });
  }, [user?.id]);

  if (!user) return <Navigate to={`/store/${club.id}`} replace />;
  return null;
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
