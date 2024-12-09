/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
    domains: ['example.com', 'localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  swcMinify: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: false,
    turbotrace: {
      logLevel: 'error'
    }
  },
  reactStrictMode: true,
  optimizeFonts: false,
  poweredByHeader: false,
  compress: true,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
