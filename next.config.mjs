/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
    ],
  },
  // Tell nginx/reverse-proxies not to buffer responses — required for
  // Next.js streaming (Suspense) to work through Hostinger's nginx proxy.
  // Without this, nginx holds the entire response until the last Suspense
  // boundary resolves (could be 60s), making the page appear completely stuck.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Accel-Buffering", value: "no" }],
      },
    ];
  },
};

export default nextConfig;
