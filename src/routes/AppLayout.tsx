import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import colors from "../styles/colors";
import Loader from "../components/Loader/Loader";
import "leaflet/dist/leaflet.css";

export default function AppLayout() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: colors.appBg,
        color: colors.black,
      }}
    >
      <div style={{ width: "min(900px, 100%)" }}>
        <Suspense fallback={<Loader label="Loading…" />}>
          <Outlet />
        </Suspense>
      </div>
    </main>
  );
}
