import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Set the turbopack root to avoid symlink issues
  turbopack: {
    root: path.resolve(__dirname),
  },
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site', '192.168.0.208', 'localhost'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
