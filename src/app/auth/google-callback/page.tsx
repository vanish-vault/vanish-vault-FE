"use client";

import { useEffect } from "react";

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
        // optionally close after short delay
        setTimeout(() => window.close(), 300);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return <div>Signing you in…</div>;
}
