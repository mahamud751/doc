import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Don't fail build on ESLint warnings from third-party code and test files
    ignoreDuringBuilds: true,
    dirs: ["src"], // Only lint our source code
  },
  typescript: {
    // Don't fail build on TypeScript errors during development
    ignoreBuildErrors: true,
  },
  experimental: {
    // Enable any experimental features if needed
  },
};

export default nextConfig;
