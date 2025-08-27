import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";

// Auth screens
const AuthEntry = lazy(() => import("@/pages/Auth/Entry/AuthEntry"));
const Login     = lazy(() => import("@/pages/Auth/Login/Login"));
const Signup    = lazy(() => import("@/pages/Auth/Signup/Signup"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: (
      <div style={{ padding: 24 }}>
        <h2>Something went wrong.</h2>
        <p>Check the browser console for details.</p>
      </div>
    ),
    children: [
      { index: true, element: <AuthEntry /> },   // 👈 MAIN SCREEN = Auth
      { path: "auth/login", element: <Login /> },
      { path: "auth/signup", element: <Signup /> },
      { path: "*", element: <div>404 – Not Found</div> },
    ],
  },
]);
