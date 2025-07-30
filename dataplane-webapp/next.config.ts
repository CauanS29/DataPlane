/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  experimental: {
    serverExternalPackages: ['@react-leaflet/core', 'leaflet']
  }
};

module.exports = nextConfig;
