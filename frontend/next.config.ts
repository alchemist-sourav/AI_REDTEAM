import type { NextConfig } from "next";

const BACKEND = "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,

  async rewrites() {
    return [
      {
        source: "/api/v1/targets/",
        destination: `${BACKEND}/api/v1/targets/`,
      },
      {
        source: "/api/v1/test-cases/",
        destination: `${BACKEND}/api/v1/test-cases/`,
      },
      {
        source: "/api/v1/executions/",
        destination: `${BACKEND}/api/v1/executions/`,
      },
      {
        source: "/api/v1/evaluations/",
        destination: `${BACKEND}/api/v1/evaluations/`,
      },
      {
        source: "/api/v1/users/",
        destination: `${BACKEND}/api/v1/users/`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;