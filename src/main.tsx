import "@fontsource-variable/inter";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/Index";
import { Provider } from "react-redux";
import { Provider as ChakraProvider } from "@/components/ui/provider";
import "leaflet/dist/leaflet.css";
import { store } from "./store";
import colors from "./styles/colors";

const rootElement = document.getElementById("root")!;

rootElement.style.backgroundColor = colors.appBg;

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <ChakraProvider>
        <RouterProvider router={router} />
      </ChakraProvider>
    </Provider>
  </StrictMode>
);
