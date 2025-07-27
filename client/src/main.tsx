import { createRoot } from "react-dom/client";
import "./index.css";
import "./components/ui/magic-ui.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./lib/theme-provider";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);
