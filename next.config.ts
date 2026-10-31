import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";
const isProd = process.env.NODE_ENV === "production";

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
