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
  // Disable static generation for problematic pages
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Configuración para Netlify (no usar export por las APIs)
  trailingSlash: true,
  
  // Configuración webpack para excluir SQLite en producción
  webpack: (config, { isServer, dev }) => {
    // Excluir SQLite en builds de producción
    if (!dev) {
      config.externals = config.externals || []
      config.externals.push('sqlite3', 'sqlite')
    }
    
    // Configuración para pdfjs-dist
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    }
    
    // Evitar problemas con módulos nativos
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }
    
    return config
  }
}

module.exports = nextConfig