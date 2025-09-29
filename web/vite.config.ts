import { defineConfig, loadEnv } from 'vite'
import { codeInspectorPlugin } from 'code-inspector-plugin';
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const api_base_url = env.VITE_API_BASE_URL || 'http://localhost:8080'
  
  return {
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
    server: {// 开发环境代理
      proxy: {
        '/api': {
          target: api_base_url,
          changeOrigin: true,
        },
      },
    },
    // 确保开发服务器正确提供静态文件
    publicDir: 'public',
  }
})
