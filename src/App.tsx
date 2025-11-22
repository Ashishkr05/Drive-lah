import React from "react";
import Header from "./components/Header";
import SubscriptionPage from "./pages/SubscriptionPage";
import DevicePage from "./pages/DevicePage";
import "./styles/device-subscription-overrides.scss";

const STORAGE_KEY = "drive_listing_state_v1";

type PageName = "subscription" | "device";

function readInitialPageFromStorage(): PageName {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "subscription";
    const parsed = JSON.parse(raw);
    const completed =
      parsed?.subscription?.completedSteps ?? parsed?.completedSteps ?? [];
    if (Array.isArray(completed) && completed.includes("Subscription")) {
      return "device";
    }
    return "subscription";
  } catch {
    return "subscription";
  }
}

const App: React.FC = () => {
  const [page, setPage] = React.useState<PageName>(() => readInitialPageFromStorage());

  const handleNavigate = (target: PageName) => {
    setPage(target);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      const existingCompleted: string[] =
        (existing?.subscription?.completedSteps as string[]) ||
        (existing?.completedSteps as string[]) ||
        [];
      const nextCompleted =
        target === "device"
          ? Array.from(new Set([...existingCompleted, "Subscription"]))
          : existingCompleted;

      const payload = {
        ...existing,
        subscription: {
          ...(existing?.subscription || {}),
          completedSteps: nextCompleted,
        },
        completedSteps: nextCompleted,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // intentionally ignore storage errors
    }
  };

  return (
    <div className="app-root">
      <Header />
      <main className="container">
        {page === "subscription" ? (
          <SubscriptionPage onNavigate={handleNavigate} />
        ) : (
          <DevicePage onNavigate={handleNavigate} />
        )}
      </main>
    </div>
  );
};

export default App;
