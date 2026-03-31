"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/src/components/ui";

export function HeroSection() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-center max-w-4xl mx-auto"
    >
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20 mb-8">
        <Shield className="size-4 text-indigo-500" />
        <span className="text-sm text-muted-foreground">
          Trusted by professionals
        </span>
      </div>

      <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
        Secure. Share. Self-Destruct.
      </h1>

      <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
        Share sensitive documents and credentials through encrypted, expirable
        links that vanish after use.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/create">
          <Button
            size="lg"
            className="bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90 transition-opacity px-8 shadow-lg shadow-indigo-500/25"
          >
            Create Secure Link
          </Button>
        </Link>
        <Button
          size="lg"
          variant="outline"
          className="border-border/50 backdrop-blur-sm"
          onClick={() =>
            document
              .getElementById("how-it-works")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          How It Works
        </Button>
      </div>
    </motion.div>
  );
}
