/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  experimental: {
    serverExternalPackages: ['@react-leaflet/core', 'leaflet']
  },
  transpilePackages: ['antd', '@ant-design/icons'],
};

module.exports = nextConfig;
