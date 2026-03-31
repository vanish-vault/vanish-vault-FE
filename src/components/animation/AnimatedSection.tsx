"use client";

import { motion } from "motion/react";
import React from "react";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animate?: "fade-up" | "scale";
  as?: keyof JSX.IntrinsicElements;
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
  animate = "fade-up",
  as = "div",
}: AnimatedSectionProps) {
  const variants = {
    "fade-up": {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
    },
    scale: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
    },
  };
  // motion has factories for intrinsic elements (motion.div, motion.tr, etc.).
  // Use a dynamic lookup to render the requested tag (e.g. `tr`) so table
  // children remain valid HTML and avoid hydration errors.
  const MotionTag: any = (motion as any)[as] || motion.div;

  return (
    <MotionTag
      initial={variants[animate].initial}
      whileInView={variants[animate].animate}
      viewport={{ once: true }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
