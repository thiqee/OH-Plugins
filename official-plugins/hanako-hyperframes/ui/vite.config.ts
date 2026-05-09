import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@hana/plugin-protocol': '../../../../project-hana/packages/plugin-protocol/dist/index.js',
      react: path.join(rootDir, 'node_modules/react'),
      'react-dom': path.join(rootDir, 'node_modules/react-dom'),
      'react/jsx-runtime': path.join(rootDir, 'node_modules/react/jsx-runtime.js'),
    },
  },
  build: {
    outDir: '../assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'panel.js',
        chunkFileNames: 'panel-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'panel.css';
          return 'panel-[hash][extname]';
        },
      },
    },
  },
});
