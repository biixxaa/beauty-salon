import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";
const isProd = process.env.NODE_ENV === "production";
const backendUrl = process.env.BACKEND_URL || (process.env.USE_STANDALONE_BACKEND === "true" ? "http://localhost:5000" : "");

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        basePath: isProd ? "/beauty-salon" : "",
        trailingSlash: true,
      }
    : {
        output: "standalone",
      }),
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    if (backendUrl) {
      return [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ];
    }
    return [];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
