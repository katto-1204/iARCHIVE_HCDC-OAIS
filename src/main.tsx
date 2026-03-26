import { createRoot } from "react-dom/client";
import * as React from "react";
import App from "./App";
import "./index.css";

function Bootstrap() {
  // Loading screen removed per user request
  return (
    <React.Suspense fallback={null}>
      <App />
    </React.Suspense>
  );
}

createRoot(document.getElementById("root")!).render(<Bootstrap />);
