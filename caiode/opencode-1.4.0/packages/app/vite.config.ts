import { defineConfig } from "vite"
import desktopPlugin from "./vite"

export default defineConfig({
  plugins: [desktopPlugin] as any,
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 4444,
    // P3-D 测试验收：DeepSeek API 代理（解决浏览器 CORS 跨域限制）
    // 前端 fetch('/deepseek-proxy/chat/completions') → 代理到 https://api.deepseek.com
    proxy: {
      '/deepseek-proxy': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/deepseek-proxy/, ''),
        headers: {
          // 保留原始 Authorization header（由 deepseek-transport.ts 注入）
        },
      },
    },
  },
  build: {
    target: "esnext",
    // sourcemap: true,
  },
})
