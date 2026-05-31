import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.lean-fit.in",
      }
    ]
  }
};

export default nextConfig;
