import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles.css";
import { LandingPage } from "./routes/index";
import { AdminPage } from "./routes/admin";

const queryClient = new QueryClient();
const path = window.location.pathname;

const App = () => {
  if (path.startsWith("/admin")) {
    return <AdminPage />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LandingPage />
    </Suspense>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
