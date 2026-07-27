import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { LandingPage } from "./routes/index";
import { AdminPage } from "./routes/admin";

const path = window.location.pathname;

const App = () => {
  if (path.startsWith("/admin")) {
    return <AdminPage />;
  }

  return <LandingPage />;
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
