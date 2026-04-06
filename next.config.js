/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
      // Legacy files have pre-existing type errors; skip during build
      ignoreBuildErrors: true,
    },
    eslint: {
      // Legacy files have pre-existing lint warnings; skip during build
      ignoreDuringBuilds: true,
    },
    webpack: (config, { isServer }) => {
      // In the browser bundle, tell Webpack to ignore Node-only optional deps
      if (!isServer) {
        config.resolve.alias = {
          ...(config.resolve.alias || {}),
          ws: false,
          'bufferutil': false,
          'utf-8-validate': false,
        }
      }
      return config
    },
  }
  
  module.exports = nextConfig
  