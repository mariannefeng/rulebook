import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import posthog from "posthog-js";
import { HeroUIProvider } from "@heroui/system";
import { SettingsProvider } from "./contexts/SettingsContext";
import { PostHogProvider } from "@posthog/react";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_ID, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2025-11-30",
});

console.log(`Rulebook v${__APP_VERSION__} (${__GIT_SHA__})`);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <HeroUIProvider>
        <SettingsProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SettingsProvider>
      </HeroUIProvider>
    </PostHogProvider>
  </StrictMode>,
);
