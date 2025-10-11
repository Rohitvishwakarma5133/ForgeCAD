/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // Image optimization configuration
  images: {
    domains: [
      'images.clerk.dev',      // Clerk user avatars
      'img.clerk.com',         // Alternative Clerk domain
      'lh3.googleusercontent.com', // Google profile images
      'avatars.githubusercontent.com' // GitHub profile images
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle Sharp in serverless environment
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
    };

    // Ignore node-specific modules in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
      };
    }

    // Handle PDF processing
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    return config;
  },

  // Environment variables
  env: {
    CUSTOM_KEY: 'cadly-production',
  },

  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/demo',
        destination: '/converter',
        permanent: false,
      },
    ];
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Performance headers for static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
        ],
      },
    ];
  },

  // Compression
  compress: true,

  // PoweredByHeader removal for security
  poweredByHeader: false,

  // React strict mode for better development experience
  reactStrictMode: true,


  // Output for serverless deployment
  output: 'standalone',

  // Typescript configuration
  typescript: {
    // Strict TypeScript checking in production
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Strict ESLint checking in production
    ignoreDuringBuilds: false,
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Server external packages (moved from experimental)
  serverExternalPackages: ['sharp', 'pdfjs-dist'],
  
  // Experimental features
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    
    // Improve build performance
    useWasmBinary: true,
  },
  
  // Optimize CSS handling and reduce preload warnings
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
  
  // CSS optimization to reduce preload warnings
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;