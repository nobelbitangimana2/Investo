/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any HTTPS origin (DiceBear avatars, etc.)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Vercel: ensure ESLint and TypeScript errors don't block the build
  // (remove these lines if you want strict CI gating)
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
