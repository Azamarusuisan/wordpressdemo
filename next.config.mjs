/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Production builds will ignore ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Production builds will still check types
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
