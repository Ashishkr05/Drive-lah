import React from "react";
import Header from "./components/Header";
import SubscriptionPage from "./pages/SubscriptionPage";
import DevicePage from "./pages/DevicePage";

const App: React.FC = () => {
  const [page, setPage] = React.useState<"subscription" | "device">("subscription");

  return (
    <div className="app-root">
      <Header />
      <main className="container">
        {page === "subscription" ? <SubscriptionPage /> : <DevicePage />}
      </main>
    </div>
  );
};

export default App;
