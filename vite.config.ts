import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) return 'vendor';
              if (id.includes('motion')) return 'motion';
              if (id.includes('@tanstack/react-query')) return 'query';
              if (id.includes('@supabase/supabase-js') || id.includes('@supabase/postgrest-js')) return 'supabase';
              if (id.includes('lucide-react')) return 'icons';
              if (id.includes('leaflet')) return 'leaflet';
            }
          }
        }
      }
    }
  };
});
