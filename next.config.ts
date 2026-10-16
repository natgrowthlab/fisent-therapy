import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Compatibility during the Vite → Next.js migration. New deployments must
  // use NEXT_PUBLIC_API_URL; an existing VITE_API_URL keeps working at build time.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? process.env.VITE_API_URL,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
