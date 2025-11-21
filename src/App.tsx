// src/App.tsx
import React from "react";
import Header from "./components/Header";
import SubscriptionPage from "./pages/SubscriptionPage";
import DevicePage from "./pages/DevicePage";

/**
 * App
 *
 * - Reads localStorage (same key used by pages) to determine whether Subscription
 *   step is already completed and therefore show Device page on initial load.
 * - Receives navigation requests from page components via onNavigate callback.
 *
 * Storage key must match the one used in SubscriptionPage / store:
 *   drive_listing_state_v1
 *
 * The localStorage payload shape (used in your pages) is:
 *  { subscription: { plan, addOns, payment, completedSteps: [ "Subscription", ... ] }, ... }
 */

const STORAGE_KEY = "drive_listing_state_v1";

type PageName = "subscription" | "device";

function readInitialPageFromStorage(): PageName {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "subscription";
    const parsed = JSON.parse(raw);
    // completed steps might be under subscription.completedSteps or top-level completedSteps
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
  // initialize from localStorage so refresh preserves page
  const [page, setPage] = React.useState<PageName>(() => readInitialPageFromStorage());

  // central navigation handler passed to pages
  // also, when we navigate from subscription -> device we ensure completed step is persisted
  const handleNavigate = (target: PageName) => {
    setPage(target);

    try {
      // Mirror completed steps to storage so refresh preserves location.
      // We only add "Subscription" when navigating to device (i.e. subscription completed).
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

      // Write back payload keeping existing shape
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
      // ignore storage errors
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
