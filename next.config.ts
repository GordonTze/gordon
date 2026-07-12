import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages — generates ./out directory.
  // The deploy.yml workflow uploads ./out to GitHub Pages.
  output: "export",

  // basePath is set automatically by actions/configure-pages in the
  // GitHub Actions workflow via NEXT_PUBLIC_BASE_PATH env var.
  // For local builds, it defaults to "" (root).
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",

  // No server-side image optimization on a static host.
  images: {
    unoptimized: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Required for Three.js / WebGL static export
  transpilePackages: ["three"],
};

export default nextConfig;
