/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    typedRoutes: false
  },
  images: {
    unoptimized: true
  }
};

export default nextConfig;
