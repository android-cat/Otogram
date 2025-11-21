/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080',
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://backend:8080/api/:path*',
            },
            {
                source: '/auth/:path*',
                destination: 'http://backend:8080/auth/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
