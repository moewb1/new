import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import colors from "../styles/colors";
import Loader from "../components/Loader/Loader";
import "leaflet/dist/leaflet.css";

export default function AppLayout() {
  useEffect(() => {
    const metaName = "theme-color";
    let meta = document.querySelector<HTMLMetaElement>(`meta[name="${metaName}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = metaName;
      document.head.appendChild(meta);
    }
    meta.content = colors.charcoalOlive;
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 20% 20%, rgba(242, 237, 218, 0.65), transparent 60%), radial-gradient(circle at 80% 10%, rgba(139, 158, 139, 0.35), transparent 68%), linear-gradient(180deg, #f2edda 0%, #e8d5c4 55%, #f2edda 100%)",
        color: colors.inkOnLight,
        paddingBlock: "var(--spacing-3)",
      }}
    >
      <div
        style={{
          width: "100%",
          minHeight: "calc(100vh - var(--spacing-3) * 2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingInline: "min(5vw, 32px)",
        }}
      >
        <Suspense fallback={<Loader label="Finding perfect matches…" fullScreen />}>
          <Outlet />
        </Suspense>
      </div>
    </main>
  );
}
