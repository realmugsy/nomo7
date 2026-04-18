/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3100/api/:path*',
      },
    ];
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/leaderboard.html', destination: '/leaderboard', permanent: true },
      { source: '/rules.html', destination: '/rules', permanent: true },
      { source: '/contacts.html', destination: '/contacts', permanent: true },
      { source: '/privacy.html', destination: '/privacy', permanent: true },
      { source: '/terms.html', destination: '/terms', permanent: true },
      { source: '/map.html', destination: '/map', permanent: true },
    ];
  },
};

export default nextConfig;
