import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images:{
    remotePatterns:[{protocol:"https",hostname:"img.clerk.com"}],
    // In dev, don't reuse optimized images for 4 hours, so a replaced file in /public shows up right away.
    ...(process.env.NODE_ENV === "development" && { minimumCacheTTL: 0 }),
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
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
