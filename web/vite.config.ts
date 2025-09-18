import { defineConfig } from 'vite'
import { codeInspectorPlugin } from 'code-inspector-plugin';
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [codeInspectorPlugin({bundler: 'vite'}), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // 确保 public 目录下的所有文件都被复制到 dist
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', 'react-icons'],
        },
      },
    },
  },
  // 确保开发服务器正确提供静态文件
  publicDir: 'public',
})
