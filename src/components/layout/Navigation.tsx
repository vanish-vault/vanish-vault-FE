"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";

import { useAppSelector } from "@/src/store/hooks";
import { Button } from "@/src/components/ui";

export function Navigation() {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/80"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] shadow-lg group-hover:shadow-xl transition-shadow">
            <Shield className="size-5 text-white" />
          </div>
          <span className="text-xl font-semibold bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] bg-clip-text text-transparent">
            VanishVault
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/pricing"
            className={`text-sm transition-colors hover:text-foreground ${
              isActive("/pricing") ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Pricing
          </Link>

          {isMounted ? (
            !isAuthenticated ? (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="text-sm">
                    Sign In
                  </Button>
                </Link>

                <Link href="/sign-up">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90 transition-opacity"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard/secrets">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90 transition-opacity"
                >
                  Dashboard
                </Button>
              </Link>
            )
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
