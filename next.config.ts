import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true, // Cloudfare optimizes them
  },
};

export default nextConfig;
