import type { NextConfig } from "next";

// "standalone" is only needed for Docker builds.
// Set DOCKER_BUILD=true in your Docker build environment.
// Vercel handles its own build — do NOT set standalone for Vercel.
const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD === "true" && { output: "standalone" }),
};

export default nextConfig;
