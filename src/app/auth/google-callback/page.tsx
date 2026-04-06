"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function GoogleCallbackPage() {
  useEffect(() => {
    try {
      const hash = window.location.hash || "";
      const params = new URLSearchParams(
        hash.startsWith("#") ? hash.slice(1) : hash,
      );
      const idToken = params.get("id_token") || params.get("idToken") || null;
      const state = params.get("state") || null;
      // Post message back to opener (include state for verification)
      if (window.opener) {
        if (idToken) {
          window.opener.postMessage(
            { id_token: idToken, state },
            window.location.origin,
          );
        } else {
          window.opener.postMessage(
            { error: "no_id_token", state },
            window.location.origin,
          );
        }
        // Close almost immediately after posting the message
        setTimeout(() => window.close(), 50);
      }
    } catch (e) {
      // ignore errors but still try to close
      window.close();
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#030712] text-white">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <Loader2 className="size-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Completing authentication...
        </p>
      </div>
    </div>
  );
}
