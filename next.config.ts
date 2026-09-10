import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "cheerp",
    "@leaningtech/cheerp-linux-x64",
    "@leaningtech/cheerp-win32-x64",
  ],
  outputFileTracingIncludes: {
    "/api/run-code": ["./node_modules/@leaningtech/cheerp-linux-x64/**"],
    "/api/check-code": ["./node_modules/@leaningtech/cheerp-linux-x64/**"],
  },
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ],
};

export default nextConfig;