import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // One prerender worker: each worker opens its own database pool, and the sister sites share Supabase's 15
  // session-pooler slots with each other's builds and live servers (7 workers ran them out: EMAXCONNSESSION).
  experimental: { cpus: 1 },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
