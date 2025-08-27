import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";

const Home = lazy(() => import("@/pages/Home/Home"));
const Users = lazy(() => import("@/pages/Users/Users"));
const User = lazy(() => import("@/pages/User/User"));

// Example loader (server-safe fetch wrappers are fine too)
async function usersLoader() {
  const res = await fetch("https://jsonplaceholder.typicode.com/users");
  if (!res.ok) throw new Response("Failed to load", { status: res.status });
  return res.json() as Promise<Array<{ id: number; name: string }>>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <div style={{ padding: 24 }}>Something went wrong.</div>,
    children: [
      { index: true, element: <Home /> },
      {
        path: "users",
        // can be something that's fetched on page load
        loader: usersLoader,
        // we can wrap the element with a parent that checks for auth
        element: <Users />,
        children: [{ path: ":id", element: <User /> }],
      },
      { path: "*", element: <div>404 – Not Found</div> },
    ],
  },
]);
