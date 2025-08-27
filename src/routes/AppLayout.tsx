import { Suspense } from "react";
import { Outlet, NavLink } from "react-router-dom";
function AppLayout() {
  return (
    <>
      <nav style={{ display: "flex", gap: 12, padding: 12 }}>
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/users">Users</NavLink>
      </nav>
      <main style={{ padding: 16 }}>
        <Suspense fallback={<div>Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}

export default AppLayout;
