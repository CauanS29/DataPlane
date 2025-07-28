/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverExternalPackages: ['@react-leaflet/core', 'leaflet']
  }
};

module.exports = nextConfig;
