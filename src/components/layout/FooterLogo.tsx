"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function FooterLogo() {
  const [isMounted, setIsMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <span className="text-lg font-semibold opacity-50">VanishVault</span>;
  }

  return (
    <img
      src={resolvedTheme === "dark" ? "/night-logo.png" : "/day-logo.png"}
      alt="VanishVault"
      className="h-8 w-auto"
    />
  );
}
