import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // Set DISABLE_HMR=true to turn off hot module reload (e.g. in hosted editors).
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
