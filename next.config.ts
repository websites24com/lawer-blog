import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, 'app/styles')],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
    ],
    // ✅ Add local pattern support for optimization:
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // deviceSizes: [640, 768, 1024, 1280, 1600],
    // imageSizes: [16, 32, 48, 64, 96, 128, 256, 512],
    // ✅ Enable static optimization for /uploads/*
    loader: 'default',
  },
};

export default nextConfig;
