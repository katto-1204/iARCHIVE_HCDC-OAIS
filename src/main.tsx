import { createRoot } from "react-dom/client";
import * as React from "react";
import App from "./App";
import "./index.css";

function Bootstrap() {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 1400);
    return () => window.clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a1628] flex flex-col items-center justify-center gap-6">
        <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive" className="w-72 max-w-[75vw] object-contain" />
        <div className="w-48 h-1.5 bg-white/15 rounded-full overflow-hidden">
          <div className="h-full bg-[#960000] loading-bar rounded-full" />
        </div>
        <p className="text-white/60 text-xs uppercase tracking-[0.2em]">Welcome to iArchive</p>
      </div>
    );
  }

  return <App />;
}

createRoot(document.getElementById("root")!).render(<Bootstrap />);
