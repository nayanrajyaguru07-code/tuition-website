/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

// next.config.js
module.exports = {
  async rewrites() {
    return [{ source: "/meeting/:slug", destination: "/meet/:slug" }];
  },
};

module.exports = nextConfig;
