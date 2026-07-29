import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Consolidated pages keep their SEO: the Dictionary is now a section of the
  // Learn page, and Sector rotation lives inside the Screener.
  async redirects() {
    return [
      { source: "/glossary", destination: "/indicators", permanent: true },
      { source: "/sectors", destination: "/screener", permanent: true },
    ];
  },
};

export default nextConfig;
