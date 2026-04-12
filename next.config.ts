import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // trailingSlash: true,
  // PWA support
  headers: async () => [
    {
      source: '/service-worker.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
        {
          key: 'Service-Worker-Allowed',
          value: '/',
        },
      ],
    },
  ],
}

export default nextConfig