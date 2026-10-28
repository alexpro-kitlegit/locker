import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ConversationView, Inbox } from "../components/Inbox";
import { Onboarding } from "../components/Onboarding";
import { SellerProfile } from "../components/SellerProfile";
import { storeRoutes } from "../lib/routes";
import { useLocker } from "../lib/store";
import { useStore } from "./StoreLayout";

export function StoreInbox() {
  const { club, user } = useStore();
  if (!user) return <Navigate to={`/store/${club.id}`} replace />;
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Inbox</h1>
      <Inbox userId={user.id} routes={storeRoutes(club.id)} />
    </div>
  );
}

export function StoreConversation() {
  const { id } = useParams();
  const { club, user } = useStore();
  if (!user) return <Navigate to={`/store/${club.id}`} replace />;
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <ConversationView convId={id!} userId={user.id} routes={storeRoutes(club.id)} />
    </div>
  );
}

/** A seller's profile inside a club store: only that club's shirts are shown here. */
export function StoreSellerProfile() {
  const { id } = useParams();
  const { club, user } = useStore();
  const s = useLocker();
  if (!s.users[id!]) return <Navigate to={`/store/${club.id}`} replace />;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <SellerProfile userId={id!} viewerId={user?.id} routes={storeRoutes(club.id)} onlyClubId={club.id} />
    </div>
  );
}

export function StoreOnboarding() {
  const { club, user } = useStore();
  const navigate = useNavigate();
  if (!user) return <Navigate to={`/store/${club.id}`} replace />;
  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <Onboarding userId={user.id} onDone={() => navigate(`/store/${club.id}/sell`, { replace: true })} />
    </div>
  );
}
