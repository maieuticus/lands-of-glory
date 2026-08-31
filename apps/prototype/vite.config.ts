import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    // Prevent server crashes from file watching issues
    watch: {
      usePolling: true,
      interval: 1000,
    },
    // Increase timeout for large projects
    hmr: {
      timeout: 5000,
    },
    // Configure headers middleware to fix content-type issues
    headers: {
      'X-Content-Type-Options': 'nosniff',
    },
  },
  build: {
    outDir: 'dist',
    target: 'ES2020',
  },
  // Optimize dependency handling
  optimizeDeps: {
    include: ['pixi.js'],
  },
  // Ensure proper MIME types for assets
  plugins: [
    {
      name: 'configure-response-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Set proper charset for all responses
          const originalWriteHead = res.writeHead.bind(res);
          res.writeHead = function(statusCode, headers) {
            // Ensure charset is utf-8
            if (headers && typeof headers === 'object' && 'Content-Type' in headers) {
              let contentType = headers['Content-Type'];
              if (typeof contentType === 'string' && !contentType.includes('charset')) {
                headers['Content-Type'] = contentType + '; charset=utf-8';
              }
            }
            return originalWriteHead(statusCode, headers);
          };
          next();
        });
      },
    },
  ],
});
