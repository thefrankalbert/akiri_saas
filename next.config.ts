import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // reactCompiler: true, // Disabled — breaks react-hook-form handleSubmit
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
