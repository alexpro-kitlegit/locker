import { useNavigate, useParams } from "react-router-dom";
import { ConversationView, Inbox } from "../components/Inbox";
import { Onboarding } from "../components/Onboarding";
import { SellerProfile } from "../components/SellerProfile";
import { BackHeader } from "../components/ui";
import { appRoutes } from "../lib/routes";
import { useLocker } from "../lib/store";

export function FanInbox() {
  const s = useLocker();
  return (
    <div className="space-y-4 px-4 pb-6 pt-1">
      <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
      <Inbox userId={s.meId} routes={appRoutes} />
    </div>
  );
}

export function FanConversation() {
  const { id } = useParams();
  const s = useLocker();
  return (
    <div className="px-4 pb-6 pt-1">
      <ConversationView convId={id!} userId={s.meId} routes={appRoutes} />
    </div>
  );
}

export function FanSellerProfile() {
  const { id } = useParams();
  const s = useLocker();
  if (!s.users[id!]) return <BackHeader title="Seller not found" />;
  return (
    <div className="pb-6">
      <BackHeader />
      <div className="px-4">
        <SellerProfile userId={id!} viewerId={s.meId} routes={appRoutes} />
      </div>
    </div>
  );
}

export function FanOnboarding() {
  const s = useLocker();
  const navigate = useNavigate();
  return (
    <div className="pb-6">
      <BackHeader />
      <div className="px-4">
        <Onboarding userId={s.meId} onDone={() => navigate("/app/sell", { replace: true })} />
      </div>
    </div>
  );
}
