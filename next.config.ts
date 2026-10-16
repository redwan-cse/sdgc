import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/aboutourclub",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/aboutourclub/",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/becomeamember",
        destination: "/join",
        permanent: true,
      },
      {
        source: "/becomeamember/",
        destination: "/join",
        permanent: true,
      },
      {
        source: "/wp-login.php",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/wp-admin",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/wp-admin/",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/wp-admin/:path*",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/feed",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/feed/",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/events/feed",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/events/feed/",
        destination: "/events",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
