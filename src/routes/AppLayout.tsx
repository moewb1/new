// src/layout/AppLayout.tsx
import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import colors from "../styles/colors";
import Loader from "../components/Loader/Loader";
import "leaflet/dist/leaflet.css";

export default function AppLayout() {
  // Set browser UI color (Android Chrome address bar, etc.)
  useEffect(() => {
    const metaName = "theme-color";
    let meta = document.querySelector<HTMLMetaElement>(`meta[name="${metaName}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = metaName;
      document.head.appendChild(meta);
    }
    meta.content = colors.appBg;
  }, []);

  return (
    <main
      style={
        {
          // expose JS theme to CSS
          ["--app-bg" as any]: colors.appBg,
          ["--app-ink" as any]: colors.black,
        } as React.CSSProperties
      }
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Suspense fallback={<Loader label="Loading…" />}>
          <Outlet />
        </Suspense>
      </div>
    </main>
  );
}
