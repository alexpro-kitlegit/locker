import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { resolveDueReviews } from "./lib/actions";
import { FanLayout } from "./fan/FanLayout";
import { FanCheckout } from "./fan/FanCheckout";
import { Dispatch } from "./fan/Dispatch";
import { Home } from "./fan/Home";
import { ListingDetail } from "./fan/ListingDetail";
import { Me } from "./fan/Me";
import { OrderDetail } from "./fan/OrderDetail";
import { Payout } from "./fan/Payout";
import { Search } from "./fan/Search";
import { Sell, SellDraft } from "./fan/Sell";
import { WalletPage } from "./fan/Wallet";
import { DemoSplit } from "./pages/DemoSplit";
import { Hub } from "./pages/Hub";
import { StoreAccount } from "./store/StoreAccount";
import { StoreCheckout } from "./store/StoreCheckout";
import { StoreHome } from "./store/StoreHome";
import { StoreItem } from "./store/StoreItem";
import { StoreLayout } from "./store/StoreLayout";
import { StoreOrder } from "./store/StoreOrder";
import { StorePayout } from "./store/StorePayout";
import { StoreSell, StoreSellStart } from "./store/StoreSell";

export default function App() {
  // Stands in for KitLegit's check finishing in the background and the listing going live (or not).
  useEffect(() => {
    const t = setInterval(resolveDueReviews, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/demo" element={<DemoSplit />} />

      {/* The Locker app: one app for fans, not white-labelled */}
      <Route path="/app" element={<FanLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="sell" element={<Sell />} />
        <Route path="sell/:draftId" element={<SellDraft />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="me" element={<Me />} />
        <Route path="listing/:id" element={<ListingDetail />} />
        <Route path="checkout/:id" element={<FanCheckout />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="orders/:id/dispatch" element={<Dispatch />} />
        <Route path="payout/:id" element={<Payout />} />
      </Route>

      {/* Club stores: one site, themed per club. In production the club comes from the domain. */}
      <Route path="/store/:clubId" element={<StoreLayout />}>
        <Route index element={<StoreHome />} />
        <Route path="item/:id" element={<StoreItem />} />
        <Route path="checkout/:id" element={<StoreCheckout />} />
        <Route path="order/:orderId" element={<StoreOrder />} />
        <Route path="sell" element={<StoreSellStart />} />
        <Route path="sell/:draftId" element={<StoreSell />} />
        <Route path="account" element={<StoreAccount />} />
        <Route path="payout/:orderId" element={<StorePayout />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
