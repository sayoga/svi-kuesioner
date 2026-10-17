import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["firebase-admin"],
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/admin/login',
        permanent: true,
      },
    ];
  },
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
