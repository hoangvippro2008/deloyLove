import type { NextConfig } from "next";
import path from "node:path";

const toList = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toHostname = (value: string) => {
  try {
    return new URL(value).hostname;
  } catch {
    return value
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/:\d+$/, "");
  }
};

const backendOrigin = (
  process.env.NEXT_PRIVATE_BACKEND_ORIGIN ??
  process.env.BACKEND_ORIGIN ??
  "http://127.0.0.1:4000"
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const allowedDevOrigins = Array.from(
  new Set([
    "*.ngrok-free.app",
    "*.ngrok.app",
    ...toList(process.env.NEXT_ALLOWED_DEV_ORIGINS).map(toHostname),
    ...toList(process.env.PUBLIC_WEB_URL).map(toHostname),
    ...toList(process.env.NGROK_URL).map(toHostname),
    ...toList(process.env.NGROK_DOMAIN).map(toHostname)
  ])
);

const nextConfig: NextConfig = {
  allowedDevOrigins,
  compress: true,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`
      }
    ];
  },
  turbopack: {
    root: path.resolve(process.cwd())
  }
};

export default nextConfig;
