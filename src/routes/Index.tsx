import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import "leaflet/dist/leaflet.css";

// Auth screens
const AuthEntry = lazy(() => import("@/pages/Auth/Entry/AuthEntry"));
const Login     = lazy(() => import("@/pages/Auth/Login/Login"));
const Signup    = lazy(() => import("@/pages/Auth/Signup/Signup"));
const Otp    = lazy(() => import("@/pages/Auth/Otp/Otp"));
const ForgetPassword     = lazy(() => import("@/pages/Auth/Login/ForgetPassword"));
const Home    = lazy(() => import("@/pages/Home/Home.tsx"));
const Booking   = lazy(() => import("@/pages/Home/Bookings"));
const Applications    = lazy(() => import("@/pages/Home/Applications"));
const LocationOnboarding    = lazy(() => import("@/pages/Auth/onboarding/LocationOnboarding"));
const IdentityOnboarding  = lazy(() => import("@/pages/Auth/onboarding/IdentityOnboarding"));
const ProviderServices    = lazy(() => import("@/pages/Auth/onboarding/ProviderServices"));
const BankDetails         = lazy(() => import("@/pages/Auth/onboarding/BankDetails"));
const Chat         = lazy(() => import("@/pages/Chat/Chat"));
const EditProfile = lazy(() => import("@/pages/Profile/EditProfile"));
const Account  = lazy(() => import("@/pages/Profile/Account"));
const Balance = lazy(() => import("@/pages/Profile/Balance"));
const Payouts = lazy(() => import("@/pages/Profile/Payouts"));

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
      { index: true, element: <AuthEntry /> },
      { path: "auth/login", element: <Login /> },
      { path: "auth/signup", element: <Signup /> },
      { path: "auth/forgot-password", element: <ForgetPassword /> },
      { path: "auth/otp", element: <Otp /> },

      // Onboarding sequence
      { path: "auth/LocationOnboarding", element: <LocationOnboarding /> },
      { path: "auth/Identity", element: <IdentityOnboarding /> },
      { path: "auth/ProviderServices", element: <ProviderServices /> },
      { path: "auth/BankDetails", element: <BankDetails /> },
      { path: "profile/EditProfile", element: <EditProfile /> },
      { path: "profile/account", element: <Account /> },
      { path: "profile/Balance", element: <Balance /> },
      { path: "profile/Payouts", element: <Payouts /> },

      { path: "home", element: <Home  /> },
      { path: "booking", element: <Booking  /> },
      { path: "applications", element: <Applications  /> },
      { path: "chat", element: <Chat  /> },
      { path: "*", element: <div>404 – Not Found</div> },
    ],
  },
]);
