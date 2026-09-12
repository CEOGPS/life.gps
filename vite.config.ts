import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      'import.meta.env.VITE_WORKER_URL': JSON.stringify(env.VITE_WORKER_URL || 'https://lifeos1-api.ceogps.workers.dev'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, './'),
      },
    },
    build: {
      rollupOptions: {
        external: ['@mlc-ai/web-llm'],
      },
    },
    server: {
      port: 3000,
    },
  };
});
