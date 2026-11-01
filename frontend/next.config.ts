import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(process.env.NODE_ENV === "development" ? [{ protocol: "http" as const, hostname: "localhost", port: "4000", pathname: "/uploads/**" }] : []),
      {
        protocol: "https",
        hostname: "cdn.lean-fit.in",
      }
    ]
  }
};

export default nextConfig;
