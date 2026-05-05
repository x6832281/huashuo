# 后端部署模块 - 详细规格说明

## 1. 模块概述

### 1.1 模块名称
后端部署模块（Backend Deployment Module）

### 1.2 模块目标
通过 Vercel Serverless Functions 部署后端 API，实现零服务器、自动扩缩容、与前端一体化部署。

### 1.3 模块定位
作为应用的后端部署模块，负责 API 服务的部署和运行。

## 2. 功能需求

### 2.1 核心功能
- **Serverless 部署**：API 代码作为 Vercel Serverless Functions 自动部署
- **一体化部署**：前端和 API 在同一 Vercel 项目中，无需跨域配置
- **自动扩缩容**：Vercel 自动管理函数实例，按需扩缩
- **环境变量管理**：通过 Vercel Dashboard 管理密钥和配置
- **日志监控**：通过 Vercel Dashboard 查看函数执行日志

### 2.2 业务规则
- **部署要求**：零服务器维护，自动扩缩容
- **安全要求**：HTTPS 默认开启，API Key 通过环境变量管理
- **更新策略**：推送代码自动部署，零停机
- **限流保护**：内存级 IP 限流防止滥用

## 3. 技术实现

### 3.1 技术栈
- **运行时**：Vercel Serverless Functions（Node.js 18.x ESM）
- **数据库**：Supabase（PostgreSQL）
- **AI 服务**：OpenRouter API（GPT-4o）
- **限流**：内存级 IP 限流（rate-limiter.js）

### 3.2 目录结构
```
api/
├── lib/                      # 公共工具库
│   ├── supabase.js           # Supabase 客户端单例
│   ├── response.js           # JSON 响应 + CORS 处理
│   └── rate-limiter.js       # IP 限流器
├── ai/
│   └── translate.js          # POST /api/ai/translate
├── share/
│   ├── create.js             # POST /api/share/create
│   ├── hug.js                # POST /api/share/hug
│   ├── batch.js              # POST /api/share/batch
│   ├── publish.js            # POST /api/share/publish
│   ├── feed.js               # GET/POST /api/share/feed
│   ├── like.js               # POST /api/share/like
│   └── comment.js            # GET/POST /api/share/comment
└── health.js                 # GET /api/health
```

### 3.3 API 端点清单

| 端点 | 方法 | 功能 | 限流 | Supabase 表 |
|------|------|------|------|------------|
| `/api/health` | GET | 健康检查 | 无 | 无 |
| `/api/ai/translate` | POST | AI 情绪翻译 | 5次/分 | 无 |
| `/api/share/create` | POST | 创建分享卡片 | 10次/分 | shared_cards |
| `/api/share/hug` | POST | 送出拥抱 | 3次/分 | hugs, shared_cards |
| `/api/share/batch` | POST | 批量查询拥抱数 | 5次/分 | shared_cards |
| `/api/share/publish` | POST | 发布到广场 | 5次/分 | square_posts |
| `/api/share/feed` | GET/POST | 获取广场信息流 | 30次/分 | square_posts |
| `/api/share/comment` | GET/POST | 评论功能 | 15次/分 | square_comments |
| `/api/share/like` | POST | 点赞功能 | 20次/分 | square_likes, square_posts |

### 3.4 公共库实现

#### 3.4.1 Supabase 客户端（api/lib/supabase.js）
```javascript
import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export function getSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return supabaseInstance;
}
```

#### 3.4.2 JSON 响应工具（api/lib/response.js）
```javascript
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...headers,
    },
  });
}

export function cors(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  return null;
}
```

#### 3.4.3 限流器（api/lib/rate-limiter.js）
```javascript
const rateLimitStore = new Map();

const PATH_LIMITS = {
  '/api/ai/translate':  { limit: 5,  window: 60 },
  '/api/share/create':  { limit: 10, window: 60 },
  '/api/share/hug':     { limit: 3,  window: 60 },
  '/api/share/batch':   { limit: 5,  window: 60 },
  '/api/share/publish': { limit: 5,  window: 60 },
  '/api/share/feed':    { limit: 30, window: 60 },
  '/api/share/comment': { limit: 15, window: 60 },
  '/api/share/like':    { limit: 20, window: 60 },
};

export function checkRateLimit(req, path) {
  const ip = req.headers.get('x-forwarded-for') ||
             req.headers.get('x-real-ip') ||
             'unknown';
  const key = `${ip}:${path}`;
  const config = PATH_LIMITS[path];
  if (!config) return null;

  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now - entry.start > config.window * 1000) {
    rateLimitStore.set(key, { start: now, count: 1 });
    return null;
  }
  entry.count++;
  if (entry.count > config.limit) {
    return { error: '请求过于频繁，请稍后再试', retryAfter: config.window };
  }
  return null;
}
```

### 3.5 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase 服务端密钥 |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API 密钥 |
| `ALLOWED_ORIGINS` | ✅ | CORS 允许的来源（逗号分隔） |
| `APP_BASE_URL` | ✅ | 应用基础 URL（生成分享链接） |

### 3.6 数据库架构

数据库使用 Supabase（PostgreSQL），通过 `supabase_migration.sql` 迁移脚本创建以下结构：

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `shared_cards` | 分享卡片 | share_id, ai_poem, mood_band, hugs_count |
| `hugs` | 拥抱记录 | share_id, device_id（防重复） |
| `square_posts` | 广场帖子 | content_text, mood_band, nickname, emoji, hugs_count |
| `square_comments` | 广场评论 | post_id, content, nickname, emoji |
| `square_likes` | 广场点赞 | post_id, device_id（防重复） |

| RPC 函数 | 用途 |
|---------|------|
| `increment_hug(share_id)` | 原子递增拥抱计数 |
| `increment_post_comments(post_id)` | 查询评论计数 |

### 3.7 降级策略

当 Supabase 未配置时，API 采用降级策略：

| API | 降级行为 |
|-----|---------|
| translate | 正常工作（使用 OpenRouter 或本地模板） |
| create | 返回模拟 share_id（数据不持久化） |
| hug | 返回模拟 hugs_count: 1 |
| batch | 返回全 0 数据 |
| publish | 返回模拟帖子数据 |
| feed | 返回空数据 |
| comment | 返回 503 错误 |
| like | 返回 503 错误 |

## 4. 测试方案

### 4.1 功能测试
- **测试场景**：
  - 所有 API 端点正常响应
  - Supabase 数据库读写正常
  - AI 翻译正常（含降级测试）
  - 限流正常触发

### 4.2 性能测试
- **测试场景**：
  - API 响应时间 < 2s（含 AI 翻译）
  - Serverless 函数冷启动 < 3s
  - 并发请求限流正常

### 4.3 安全测试
- **测试场景**：
  - CORS 头正确返回
  - 环境变量未泄露
  - 限流防止滥用
  - SQL 注入防护（Supabase SDK 自动处理）

## 5. 部署与兼容性

### 5.1 部署环境
- **运行时**：Vercel Serverless Functions（Node.js 18.x）
- **数据库**：Supabase（PostgreSQL 15）
- **AI 服务**：OpenRouter API

### 5.2 部署流程
1. 推送代码到 GitHub main 分支
2. Vercel 自动检测 `api/` 目录下的 `.js` 文件
3. 每个文件自动注册为一个 Serverless Function
4. 路由由文件路径决定（如 `api/share/hug.js` → `/api/share/hug`）
5. 部署完成（通常 1-2 分钟）

### 5.3 Vercel 函数配置
Vercel 自动为 `api/` 目录下的每个 `.js` 文件创建 Serverless Function：
- **运行时**：Node.js 18.x
- **模块系统**：ESM（`import/export`）
- **内存**：1024MB（默认）
- **超时**：10s（Hobby 版）/ 60s（Pro 版）
- **区域**：iad1（美东，默认）

## 6. 风险与应对

### 6.1 风险
- **冷启动延迟**：Serverless 函数首次调用可能有 1-3s 延迟
- **内存限流**：限流数据存储在内存中，函数实例重启后清零
- **Supabase 不可用**：数据库服务故障导致 API 失败
- **OpenRouter 余额不足**：AI 翻译失败

### 6.2 应对措施
- **冷启动**：Vercel 自动预热常用函数；健康检查端点可作为保活
- **限流持久化**：当前使用内存限流，未来可升级到 Supabase/Redis
- **降级策略**：Supabase 不可用时返回模拟数据或 503 错误
- **本地模板**：AI 翻译失败时自动降级到 10 条本地模板

## 7. 依赖关系

### 7.1 依赖模块
- AI 翻译集成模块（api/ai/translate.js）
- Supabase 集成模块（api/lib/supabase.js）
- 防刷限流模块（api/lib/rate-limiter.js）

### 7.2 被依赖模块
- 前端部署模块（前端和 API 在同一 Vercel 项目中）

## 8. 验收标准

### 8.1 功能验收
- 所有 API 端点正常响应
- Supabase 读写正常
- AI 翻译正常（含降级）
- 限流正常

### 8.2 性能验收
- API 响应时间 < 2s
- Serverless 冷启动 < 3s

### 8.3 安全验收
- HTTPS 正常
- CORS 配置正确
- 密钥未泄露
- 限流有效
