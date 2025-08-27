/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  typescript: {
    // Temporarily ignore TS errors on build to allow deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore ESLint errors on build  
    ignoreDuringBuilds: true,
  },
  // Prevent static generation issues
  trailingSlash: false,
  generateEtags: false,
  
  // Performance optimizations
  experimental: {
    missingSuspenseWithCSRBailout: false,
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js']
  },
  
  // Compiler optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Cache optimization
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1 minute
    pagesBufferLength: 5
  },
  
  // Build optimization to prevent prerender issues
  poweredByHeader: false,
  compress: true,
  
  // Webpack configuration to handle potential issues
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  }
}

module.exports = nextConfig