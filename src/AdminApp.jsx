// src/AdminApp.jsx  — Admin-only dashboard shell
import { useState } from "react";
import { C } from "./theme/colors";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./auth/AuthContext";

// Pages
import OverviewPage    from "./pages/OverviewPage";
import GenderPage      from "./pages/GenderPage";
import ReviewsPage     from "./pages/ReviewsPage";
import JourneyPage     from "./pages/JourneyPage";
import RevenuePage     from "./pages/RevenuePage";
import OpportunityPage from "./pages/OpportunityPage";
import CataloguePage   from "./pages/CataloguePage";
import BrandsPage      from "./pages/BrandsPage";
import EffectsPage     from "./pages/EffectsPage";
import PricingPage     from "./pages/PricingPage";
import SkinTypesPage   from "./pages/SkinTypesPage";
import ChatbotPage     from "./pages/ChatbotPage";
import UsersPage       from "./pages/UsersPage";

const PAGES = {
  overview:    <OverviewPage />,
  gender:      <GenderPage />,
  reviews:     <ReviewsPage />,
  journey:     <JourneyPage />,
  revenue:     <RevenuePage />,
  opportunity: <OpportunityPage />,
  catalogue:   <CataloguePage />,
  brands:      <BrandsPage />,
  effects:     <EffectsPage />,
  pricing:     <PricingPage />,
  skintypes:   <SkinTypesPage />,
  chatbot:     <ChatbotPage />,
  users:       <UsersPage />,
};

export default function AdminApp() {
  const [page, setPage] = useState("overview");
  const { user, logout } = useAuth();

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: C.text,
    }}>
      <Sidebar page={page} setPage={setPage} user={user} onLogout={logout} />

      <main style={{
        flex: 1,
        padding: "2rem 2.5rem",
        overflowY: "auto",
        minWidth: 0,
      }}>
        {PAGES[page] ?? <OverviewPage />}
      </main>
    </div>
  );
}
