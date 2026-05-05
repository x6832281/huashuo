# 前端部署模块 - 详细规格说明

## 1. 模块概述

### 1.1 模块名称
前端部署模块（Frontend Deployment Module）

### 1.2 模块目标
通过 Vercel 一键部署前端静态资源，实现自动 CI/CD、全球 CDN 加速和 HTTPS。

### 1.3 模块定位
作为应用的前端部署模块，负责 Vue 3 SPA 的构建优化和静态资源托管。

## 2. 功能需求

### 2.1 核心功能
- **构建优化**：Vite 构建产物优化（代码分割、压缩、Tree-shaking）
- **静态托管**：部署到 Vercel 平台，自动分配域名
- **CDN 配置**：Vercel 自带全球 CDN，无需额外配置
- **CI/CD 自动化**：推送到 GitHub 自动触发部署
- **SPA 路由支持**：通过 vercel.json rewrites 配置前端路由

### 2.2 业务规则
- **构建要求**：构建产物 < 1MB，加载速度快
- **部署目标**：支持 HTTPS，全球访问延迟 < 200ms
- **更新策略**：推送代码自动部署，零停机更新
- **PWA 支持**：manifest.json + service-worker.js 随前端一起部署

## 3. 技术实现

### 3.1 技术栈
- **构建工具**：Vite 6.x
- **框架**：Vue 3.5 + Vue Router 4.x + Pinia 3.x
- **托管服务**：Vercel（Hobby 版免费）
- **CI/CD**：Vercel 内置（无需额外配置）

### 3.2 构建配置

#### 3.2.1 Vite 构建配置
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue(), copyStatic()],
  base: './',
  build: {
    outDir: 'dist',
    minify: 'terser',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          chart: ['chart.js']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://你的域名.vercel.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

#### 3.2.2 Vercel 部署配置
```json
// vercel.json
{
  "version": 2,
  "rewrites": [
    { "source": "/s/:shareId", "destination": "/index.html" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ],
  "trailingSlash": false
}
```

**关键配置说明**：
- `rewrites[0]`：分享落地页 `/s/:shareId` 路由到 index.html（SPA）
- `rewrites[1]`：所有非 `/api/` 路径路由到 index.html（SPA 兜底）
- `headers[0]`：API 端点的 CORS 头
- `headers[1]`：安全头（防点击劫持、MIME 嗅探、XSS）

#### 3.2.3 Service Worker 配置
```javascript
// service-worker.js
const CACHE_NAME = 'huashuo-app-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// 安装事件 - 预缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// fetch 事件 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseToCache));
          return response;
        });
      })
  );
});
```

### 3.3 PWA Manifest
```json
// manifest.json
{
  "name": "话说 - 零压力树洞",
  "short_name": "话说",
  "description": "零压力匿名情绪记录与AI加密分享工具",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 3.4 部署流程

1. 推送代码到 GitHub main 分支
2. Vercel 自动检测到推送，触发构建
3. 执行 `npm run build` 生成 dist/
4. 部署 dist/ 到 Vercel 全球 CDN
5. 自动配置 HTTPS 证书
6. 部署完成（通常 1-2 分钟）

## 4. 测试方案

### 4.1 功能测试
- **测试场景**：
  - 构建成功，无报错
  - 部署后首页可访问
  - SPA 路由正常（刷新页面不 404）
  - 静态资源加载正常
  - PWA 安装功能正常

### 4.2 性能测试
- **测试场景**：
  - 首屏加载时间 < 2s
  - Lighthouse Performance 评分 > 80
  - 构建产物总大小 < 1MB

### 4.3 兼容性测试
- **测试场景**：
  - Chrome / Firefox / Safari / Edge 正常访问
  - 移动端浏览器正常访问
  - 弱网环境下可加载

## 5. 部署与兼容性

### 5.1 部署环境
- **托管服务**：Vercel Hobby 版（免费）
- **CDN**：Vercel 自带全球 CDN
- **HTTPS**：Vercel 自动配置 SSL 证书
- **自定义域名**：支持绑定自定义域名

### 5.2 环境变量
Vercel 中配置的前端相关环境变量：

| 变量名 | 说明 |
|--------|------|
| `APP_BASE_URL` | 应用基础 URL（用于生成分享链接） |

> 注意：前端代码中的 API 地址使用相对路径 `/api/*`，Vercel 会自动路由到 Serverless Functions，无需配置 API_URL。

## 6. 风险与应对

### 6.1 风险
- **构建失败**：依赖版本冲突或 Node.js 版本不兼容
- **缓存问题**：Service Worker 缓存导致用户看到旧版本
- **图标缺失**：PWA 图标文件未正确部署

### 6.2 应对措施
- **版本锁定**：package-lock.json 锁定依赖版本
- **缓存版本化**：更新时修改 CACHE_NAME 版本号
- **构建脚本**：vite.config.js 中使用 copy-static 插件自动复制图标和 manifest

## 7. 依赖关系

### 7.1 依赖模块
- 所有前端模块（src/ 下所有代码）

### 7.2 被依赖模块
- 后端部署模块（前端和 API 在同一 Vercel 项目中）

## 8. 验收标准

### 8.1 功能验收
- `npm run build` 构建成功
- Vercel 部署成功，首页可访问
- SPA 路由正常
- PWA 安装功能正常

### 8.2 性能验收
- 首屏加载时间 < 2s
- 构建产物 < 1MB
- Lighthouse Performance > 80

### 8.3 兼容性验收
- 主流浏览器正常访问
- 移动端正常访问
- HTTPS 正常
