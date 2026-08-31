/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_ENTERPRISE_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
      {
        source: '/ws',
        destination: `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/client/dashboard`,
      },
    ];
  },
};

module.exports = nextConfig;