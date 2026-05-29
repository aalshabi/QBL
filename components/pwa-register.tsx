"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        registration.update().catch(() => undefined);
      } catch {
        // PWA support should never block the application UI.
      }
    };

    if (document.readyState === "complete") {
      void register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
