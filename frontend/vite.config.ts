import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), ''); // Load from root .env for defines

  return {
    envDir: '..', // Tell Vite to look for .env in the root directory
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // These are still needed if the code uses process.env somewhere, 
      // but ideally we should migrate to import.meta.env
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.REACT_APP_MAPBOX_TOKEN': JSON.stringify(env.REACT_APP_MAPBOX_TOKEN)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
