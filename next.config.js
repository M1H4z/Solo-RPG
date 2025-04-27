/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost", "your-supabase-project.supabase.co"],
  },
  // Ignore ESLint errors during build
  eslint: {
    // Warning: This setting is only meant for development and should be removed for production builds
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during build
  typescript: {
    // Warning: This setting is only meant for development and should be removed for production builds
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
