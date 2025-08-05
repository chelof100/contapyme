import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  base: mode === 'production' ? '/contapyme/' : '/',
  server: {
    port: 5173,
    host: true,
    open: true,
  },
           plugins: [
           react(),
           mode === 'development' &&
           componentTagger(),
           mode === 'production' &&
           visualizer({
             filename: 'dist/stats.html',
             open: false,
             gzipSize: true,
             brotliSize: true,
           }),
         ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    rollupOptions: {
      output: {
                       manualChunks: {
                 vendor: ['react', 'react-dom'],
                 supabase: ['@supabase/supabase-js'],
                 query: ['@tanstack/react-query'],
                 ui: [
                   '@radix-ui/react-dialog',
                   '@radix-ui/react-dropdown-menu',
                   '@radix-ui/react-select',
                   '@radix-ui/react-tabs',
                   '@radix-ui/react-toast',
                   '@radix-ui/react-tooltip',
                   '@radix-ui/react-alert-dialog',
                   '@radix-ui/react-accordion',
                   '@radix-ui/react-avatar',
                   '@radix-ui/react-checkbox',
                   '@radix-ui/react-collapsible',
                   '@radix-ui/react-context-menu',
                   '@radix-ui/react-hover-card',
                   '@radix-ui/react-label',
                   '@radix-ui/react-menubar',
                   '@radix-ui/react-navigation-menu',
                   '@radix-ui/react-popover',
                   '@radix-ui/react-progress',
                   '@radix-ui/react-radio-group',
                   '@radix-ui/react-scroll-area',
                   '@radix-ui/react-separator',
                   '@radix-ui/react-slider',
                   '@radix-ui/react-slot',
                   '@radix-ui/react-switch',
                   '@radix-ui/react-toggle',
                   '@radix-ui/react-toggle-group'
                 ],
                 utils: ['date-fns', 'clsx', 'class-variance-authority', 'zod'],
                 forms: ['react-hook-form', '@hookform/resolvers'],
                 icons: ['lucide-react'],
                 notifications: ['sonner'],
               },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'coverage/'
      ]
    }
  }
}));
