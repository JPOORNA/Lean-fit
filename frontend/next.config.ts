import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.tanvish.co.in",
      },
      {
        protocol: "https",
        hostname: "c1-api.tanvish.co.in",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      }
    ]
  }
};

export default nextConfig;
