# 话说APP 部署指南

> 本文档面向新人，详细说明如何将话说APP部署到生产环境。
> 当前架构：**Vercel（前端 + Serverless API）+ Supabase（数据库）+ OpenRouter（AI服务）**
> 预计完成时间：1-2小时（不含域名审核等待时间）

---

## 目录

1. [架构概览](#1-架构概览)
2. [注册 Supabase 并创建数据库](#2-注册-supabase-并创建数据库)
3. [注册 OpenRouter 并获取 API Key](#3-注册-openrouter-并获取-api-key)
4. [将代码推送到 GitHub](#4-将代码推送到-github)
5. [部署到 Vercel（前端 + API 一体化）](#5-部署到-vercel前端--api-一体化)
6. [配置环境变量](#6-配置环境变量)
7. [注册域名并配置 DNS（可选）](#7-注册域名并配置-dns可选)
8. [生成 PWA 图标](#8-生成-pwa-图标)
9. [本地开发环境配置](#9-本地开发环境配置)
10. [最终验证清单](#10-最终验证清单)
11. [常见问题排查](#11-常见问题排查)
12. [费用估算](#12-费用估算)

---

## 1. 架构概览

### 1.1 技术架构

```
┌─────────────────────────────────────────────────────┐
│                    Vercel 平台                        │
│                                                      │
│  ┌──────────────┐    ┌─────────────────────────────┐ │
│  │  前端静态资源  │    │  Serverless Functions (API)  │ │
│  │  (Vue 3 SPA)  │    │                             │ │
│  │              │    │  /api/ai/translate   ← AI翻译 │ │
│  │  dist/       │    │  /api/share/create   ← 创建  │ │
│  │  index.html  │    │  /api/share/hug      ← 拥抱  │ │
│  │  assets/     │    │  /api/share/batch    ← 批量  │ │
│  │              │    │  /api/share/feed     ← 广场  │ │
│  └──────────────┘    │  /api/share/publish  ← 发布  │ │
│                      │  /api/share/like     ← 点赞  │ │
│                      │  /api/share/comment  ← 评论  │ │
│                      │  /api/health         ← 健康  │ │
│                      └──────────┬──────────────────┘ │
└─────────────────────────────────┼────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────▼─────┐ ┌────▼────┐ ┌──────▼──────┐
              │ Supabase   │ │OpenRouter│ │  浏览器本地  │
              │ PostgreSQL │ │ GPT-4o  │ │ IndexedDB   │
              │            │ │         │ │ LocalStorage│
              └────────────┘ └─────────┘ └─────────────┘
```

### 1.2 为什么选择这个架构

| 特点 | 说明 |
|------|------|
| **零服务器** | 不需要购买或维护任何服务器，Vercel Serverless 自动扩缩容 |
| **一体化部署** | 前端和 API 在同一个 Vercel 项目中，无需跨域配置 |
| **免费额度充足** | Vercel 免费版支持 100GB 带宽/月、100 小时函数执行/月 |
| **自动 CI/CD** | 推送代码到 GitHub 后自动部署 |
| **全球 CDN** | Vercel 自带全球 CDN，访问速度快 |

### 1.3 项目目录结构

```
whisper/
├── api/                          # Vercel Serverless Functions（后端API）
│   ├── lib/                      # 公共工具库
│   │   ├── supabase.js           # Supabase 客户端
│   │   ├── response.js           # JSON响应 + CORS
│   │   └── rate-limiter.js       # 限流器
│   ├── ai/
│   │   └── translate.js          # AI情绪翻译
│   ├── share/
│   │   ├── create.js             # 创建分享卡片
│   │   ├── hug.js                # 送拥抱
│   │   ├── batch.js              # 批量查询拥抱数
│   │   ├── publish.js            # 发布到广场
│   │   ├── feed.js               # 广场信息流
│   │   ├── like.js               # 点赞
│   │   └── comment.js            # 评论
│   └── health.js                 # 健康检查
├── src/                          # Vue 3 前端源码
├── dist/                         # 构建输出（自动生成）
├── supabase_migration.sql        # 数据库迁移脚本
├── vercel.json                   # Vercel 部署配置
├── vite.config.js                # Vite 构建配置
├── .env.example                  # 环境变量模板
└── package.json                  # 项目依赖
```

---

## 2. 注册 Supabase 并创建数据库

Supabase 提供免费的 PostgreSQL 数据库，用于存储分享卡片、广场帖子、拥抱、评论、点赞等数据。

### 2.1 注册账号

1. 打开浏览器，访问 https://supabase.com
2. 点击页面右上角 **"Start your project"** 按钮
3. 选择 **"Sign in with GitHub"**（推荐使用 GitHub 账号登录）
4. 授权 Supabase 访问你的 GitHub 账号
5. 补充组织信息：名称填 `huashuo`，点击 **"Complete setup"**

### 2.2 创建项目

1. 登录后，点击 **"New Project"** 按钮
2. 填写项目信息：
   - **Name**：`huashuo-app`
   - **Database Password**：点击 **"Generate a password"** 自动生成，**⚠️ 把这个密码复制保存到安全的地方**
   - **Region**：选择 **Northeast Asia (Tokyo)** 或 **Southeast Asia (Singapore)**（离中国最近）
   - **Plan**：选择 **Free**（免费版，500MB 存储足够）
3. 点击 **"Create new project"** 按钮
4. 等待约 2 分钟，项目创建完成

### 2.3 获取连接信息

1. 项目创建完成后，在左侧菜单点击 **"Settings"**（齿轮图标）
2. 点击 **"API"** 选项卡
3. 找到以下两个值，**复制保存**：
   - **Project URL**：类似 `https://xxxxx.supabase.co`（这是 `SUPABASE_URL`）
   - **service_role key**：点击 "Reveal" 显示，类似 `eyJhbGci...`（这是 `SUPABASE_SERVICE_ROLE_KEY`）
4. ⚠️ **注意**：service_role key 拥有完全权限，绝对不能公开分享或提交到代码仓库

### 2.4 执行数据库迁移脚本

1. 在 Supabase 左侧菜单点击 **"SQL Editor"**（SQL图标）
2. 点击 **"New query"** 按钮
3. 打开项目中的文件 `supabase_migration.sql`，全选复制内容
4. 粘贴到 SQL 编辑器中
5. 点击右下角 **"Run"** 按钮（或按 Ctrl+Enter）
6. 看到绿色提示 "Success" 表示执行成功

### 2.5 验证表结构

在左侧点击 **"Table Editor"**，应该能看到以下 5 张表：

| 表名 | 用途 |
|------|------|
| `shared_cards` | 分享卡片数据 |
| `hugs` | 拥抱记录（防重复） |
| `square_posts` | 广场帖子 |
| `square_comments` | 广场评论 |
| `square_likes` | 广场点赞（防重复） |

在 SQL Editor 中运行以下查询验证：

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

应该返回上述 5 张表。

---

## 3. 注册 OpenRouter 并获取 API Key

OpenRouter 是 AI 模型代理服务，用于调用 GPT-4o 进行情绪翻译（将心事转化为诗句、热梗、名言等）。

### 3.1 注册账号

1. 打开浏览器，访问 https://openrouter.ai
2. 点击右上角 **"Sign In"** 按钮
3. 选择 **"Continue with GitHub"**（用 GitHub 账号登录最方便）
4. 授权 OpenRouter 访问你的 GitHub 账号

### 3.2 充值（可选但推荐）

OpenRouter 按使用量付费。GPT-4o 大约 $2.5/百万 token。

1. 登录后，点击右上角你的头像
2. 点击 **"Credits"**
3. 点击 **"Add Credits"**
4. 建议先充值 **$5**（约可翻译 2000 条心事）
5. 选择支付方式（支持信用卡），完成支付

> 💡 **不充值也能用**：AI 翻译失败时会自动降级到本地模板（10条预设文案 × 3个情绪档位），功能不受影响。

### 3.3 创建 API Key

1. 点击右上角你的头像，选择 **"Keys"**
2. 点击 **"Create Key"** 按钮
3. **Name**：填 `huashuo-app`
4. **Limit**：可以不填（不限制额度）
5. 点击 **"Create"**
6. ⚠️ **立即复制并保存这个 Key**（类似 `sk-or-v1-xxxxx`），关闭窗口后无法再查看

---

## 4. 将代码推送到 GitHub

### 4.1 安装 Git

1. 下载 Git：https://git-scm.com/download/win
2. 双击安装，一路 Next 即可（默认选项）
3. 安装完成后，打开 PowerShell 验证：
   ```powershell
   git --version
   ```
   应显示类似 `git version 2.43.0`

### 4.2 配置 Git 用户信息

在 PowerShell 中运行：

```powershell
git config --global user.name "你的GitHub用户名"
git config --global user.email "你的GitHub邮箱"
```

### 4.3 创建 GitHub 仓库

1. 打开 https://github.com
2. 点击右上角 **"+"** → **"New repository"**
3. 填写：
   - **Repository name**：`huashuo`
   - **Description**：`话说APP - 零压力匿名情绪记录与加密分享工具`
   - **可见性**：选择 **Public**（公开才能使用免费的 Vercel）
4. 点击 **"Create repository"**
5. ⚠️ 不要勾选 "Add a README file"（我们已有代码）

### 4.4 推送代码

在 PowerShell 中运行（在项目目录下）：

```powershell
cd e:\learning\web\260406\whisper

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 创建首次提交
git commit -m "话说APP V2.0 - Vercel Serverless架构"

# 设置远程仓库（替换为你的 GitHub 用户名）
git remote add origin https://github.com/你的用户名/huashuo.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

如果弹出 GitHub 登录窗口，输入你的用户名和 Personal Access Token（不是密码）。

### 4.5 创建 Personal Access Token（如果需要）

1. 在 GitHub 点击右上角头像 → **"Settings"**
2. 左侧最下方点击 **"Developer settings"**
3. 点击 **"Personal access tokens"** → **"Tokens (classic)"**
4. 点击 **"Generate new token"** → **"Generate new token (classic)"**
5. **Note**：填 `huashuo-deploy`
6. **Expiration**：选 90 天
7. **Scopes**：勾选 `repo`（完整仓库访问）
8. 点击 **"Generate token"**
9. ⚠️ 复制并保存这个 Token（只显示一次）

---

## 5. 部署到 Vercel（前端 + API 一体化）

Vercel 会同时部署前端静态资源和 `api/` 目录下的 Serverless Functions，无需单独部署后端。

### 5.1 注册 Vercel

1. 打开 https://vercel.com
2. 点击 **"Sign Up"**
3. 选择 **"Continue with GitHub"**
4. 授权 Vercel 访问你的 GitHub 账号

### 5.2 导入项目

1. 登录后，点击 **"Add New..."** → **"Project"**
2. 在列表中找到 `huashuo` 仓库，点击 **"Import"**
3. 配置项目：
   - **Framework Preset**：选择 **Vue.js**（Vercel 会自动检测）
   - **Root Directory**：保持默认 `.`（根目录）
   - **Build Command**：`npm run build`（应该自动填充）
   - **Output Directory**：`dist`（应该自动填充）
4. ⚠️ **暂时不要点击 Deploy**，先配置环境变量（见下一节）

### 5.3 配置环境变量（部署前必做）

在导入页面展开 **"Environment Variables"** 部分，逐个添加：

| Key | Value | 来源 |
|-----|-------|------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | 步骤 2.3 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | 步骤 2.3 |
| `OPENROUTER_API_KEY` | `sk-or-v1-xxxxx` | 步骤 3.3 |
| `ALLOWED_ORIGINS` | `https://你的域名.vercel.app` | 部署后获得 |
| `APP_BASE_URL` | `https://你的域名.vercel.app` | 部署后获得 |

> 💡 `ALLOWED_ORIGINS` 和 `APP_BASE_URL` 可以先填临时值，部署后获得正式域名再更新。

每添加一个变量：输入 Key → 输入 Value → 点击 **"Add"**

### 5.4 执行部署

1. 点击 **"Deploy"** 按钮
2. 等待约 1-2 分钟，部署完成
3. 🎉 你会看到一个部署成功的庆祝动画
4. 点击 **"Continue to Dashboard"**
5. 点击顶部的域名链接（类似 `huashuo-xxxxx.vercel.app`），即可访问应用

### 5.5 验证部署

1. 在浏览器打开 Vercel 分配的域名
2. 应该能看到话说APP的首页
3. 访问 `https://你的域名.vercel.app/api/health`，应该返回：
   ```json
   {
     "status": "healthy",
     "timestamp": "...",
     "openrouter_configured": true,
     "supabase_configured": true,
     "node_version": "..."
   }
   ```

### 5.6 更新环境变量中的域名

1. 在 Vercel Dashboard → 你的项目 → **Settings** → **Environment Variables**
2. 更新 `ALLOWED_ORIGINS` 为你的 Vercel 域名（如 `https://huashuo-xxxxx.vercel.app`）
3. 更新 `APP_BASE_URL` 为同样的域名
4. 点击 **"Save"**
5. 重新部署：点击 **"Deployments"** → 最新部署右侧 **"..."** → **"Redeploy"**

---

## 6. 配置环境变量

### 6.1 环境变量完整清单

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `SUPABASE_URL` | ✅ | Supabase 项目 URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase 服务端密钥 | `eyJhbGci...` |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API 密钥 | `sk-or-v1-xxxxx` |
| `ALLOWED_ORIGINS` | ✅ | 允许的跨域来源（逗号分隔） | `https://huashuo.app,https://www.huashuo.app` |
| `APP_BASE_URL` | ✅ | 应用基础 URL（用于生成分享链接） | `https://huashuo.app` |

### 6.2 在 Vercel 中管理环境变量

1. 进入 Vercel Dashboard → 你的项目
2. 点击 **Settings** → **Environment Variables**
3. 可以为不同环境（Production / Preview / Development）设置不同的值
4. 修改环境变量后需要重新部署才能生效

### 6.3 本地开发环境变量

1. 复制 `.env.example` 为 `.env`：
   ```powershell
   cp .env.example .env
   ```
2. 编辑 `.env`，填入真实的值
3. ⚠️ `.env` 已在 `.gitignore` 中，不会被提交到 Git

---

## 7. 注册域名并配置 DNS（可选）

如果不想使用 Vercel 默认域名（`xxx.vercel.app`），可以配置自定义域名。

### 7.1 选择域名注册商

| 注册商 | 价格 | 优点 |
|--------|------|------|
| Cloudflare (推荐) | ~$10/年 | 免费CDN+SSL，DNS解析快 |
| Namesilo | ~$9/年 | 便宜，免费隐私保护 |
| 阿里云 | ~$55/年 | 中文界面，国内访问快 |

### 7.2 以 Cloudflare 为例注册域名

1. 打开 https://www.cloudflare.com
2. 点击 **"Sign Up"** 注册账号
3. 登录后，在搜索框输入你想要的域名（如 `huashuo.app`）
4. 如果可用，点击 **"Purchase"** 购买
5. 填写注册信息，完成支付

### 7.3 在 Vercel 中添加自定义域名

1. 进入 Vercel Dashboard → 你的项目 → **Settings** → **Domains**
2. 输入你的域名（如 `huashuo.app`），点击 **"Add"**
3. Vercel 会显示需要添加的 DNS 记录：
   - **类型**：CNAME
   - **名称**：`@` 或 `www`
   - **值**：`cname.vercel-dns.com`
4. 同时添加 `www.huashuo.app`

### 7.4 在 Cloudflare 配置 DNS

1. 在 Cloudflare 仪表板，点击你的域名
2. 点击左侧 **"DNS"** → **"Records"**
3. 添加以下 DNS 记录：

| 类型 | 名称 | 内容 | 代理状态 | TTL |
|------|------|------|----------|-----|
| CNAME | `www` | `cname.vercel-dns.com` | 关闭代理(灰色云) | Auto |
| CNAME | `@` | `cname.vercel-dns.com` | 关闭代理(灰色云) | Auto |

> ⚠️ **重要**：Vercel 自带 SSL 证书，Cloudflare 的代理（橙色云）可能导致冲突。建议关闭代理（灰色云），让 Vercel 直接处理 SSL。

### 7.5 验证域名

1. 在 Vercel Domains 页面，等待域名验证通过（通常 1-5 分钟）
2. Vercel 会自动配置 SSL 证书
3. 验证通过后，更新环境变量：
   - `ALLOWED_ORIGINS`：`https://huashuo.app,https://www.huashuo.app`
   - `APP_BASE_URL`：`https://huashuo.app`
4. 重新部署

---

## 8. 生成 PWA 图标

### 8.1 准备源图标

1. 使用任意图片编辑工具（推荐 https://www.figma.com 或 https://www.canva.com）
2. 创建一个 512×512 像素的画布
3. 设计图标（建议使用"话说"文字 + 深色背景 + 暖金色文字）
4. 导出为 PNG 格式，保存为 `icon-512x512.png`

### 8.2 生成多尺寸图标

1. 访问 https://www.pwabuilder.com/imageCreator
2. 上传你的 512×512 图标
3. 点击 **"Generate"**
4. 下载生成的图标包
5. 将以下文件复制到项目的 `icons/` 目录：

```
icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png
```

### 8.3 重新部署

```powershell
cd e:\learning\web\260406\whisper
npm run build
git add .
git commit -m "添加PWA图标"
git push
```

推送后 Vercel 会自动重新部署。

---

## 9. 本地开发环境配置

### 9.1 安装依赖

```powershell
cd e:\learning\web\260406\whisper
npm install
```

### 9.2 配置环境变量

```powershell
cp .env.example .env
```

编辑 `.env`，填入真实的 Supabase 和 OpenRouter 密钥。

### 9.3 启动开发服务器

```powershell
npm run dev
```

浏览器访问 http://localhost:3000

### 9.4 本地 API 代理

`vite.config.js` 已配置开发代理，本地 `/api/*` 请求会转发到线上 Vercel API：

```javascript
proxy: {
  '/api': {
    target: process.env.VITE_API_PROXY || 'https://huashuo.app',
    changeOrigin: true,
    secure: false,
  }
}
```

> 💡 可通过环境变量 `VITE_API_PROXY` 自定义代理目标，无需修改代码：
> ```powershell
> $env:VITE_API_PROXY="https://huashuo-xxxxx.vercel.app"; npm run dev
> ```

### 9.5 构建生产版本

```powershell
npm run build
```

构建产物在 `dist/` 目录，可以用 `npm run preview` 预览。

---

## 10. 最终验证清单

### 10.1 前端验证

| # | 验证项 | 操作 | 期望结果 |
|---|--------|------|----------|
| 1 | 首页可访问 | 浏览器打开应用 URL | 看到话说APP首页 |
| 2 | HTTPS 正常 | 查看地址栏 | 有锁头图标 |
| 3 | SPA 路由 | 点击底部"树洞"Tab | 页面切换，不刷新 |
| 4 | 底部导航 | 查看6个Tab | 心事/树洞/卡片/广场/回声/设置 |
| 5 | PWA 安装 | Chrome 地址栏右侧 | 出现"安装"图标 |

### 10.2 API 验证

| # | 验证项 | 操作 | 期望结果 |
|---|--------|------|----------|
| 1 | 健康检查 | 访问 `/api/health` | 返回 JSON，supabase_configured: true |
| 2 | AI翻译 | 写下心事 → 生成卡片 | 返回诗句+表情包（或本地模板） |
| 3 | 创建分享 | 在卡片页点击分享 | 返回 share_id |
| 4 | 送拥抱 | 打开分享落地页 → 点击送拥抱 | 返回 hugs_count |
| 5 | 广场信息流 | 进入广场页面 | 显示帖子列表（或空状态） |

### 10.3 完整功能验证

#### 核心闭环（心事→卡片→分享→拥抱）

1. 打开应用
2. 进入 **设置** → 选择一个身份（如"小明😊"）
3. 回到 **首页** → 点击"写下心事"
4. 输入心事（如"今天有点累"）→ 提交
5. 进入 **树洞** → 确认心事已保存
6. 点击心事 → 进入 **卡片** 页面
7. 点击"生成卡片" → 等待 AI 生成诗句
8. 查看卡片预览（含诗句+二维码）
9. 点击"分享卡片" → 复制链接
10. 在另一个浏览器（或无痕模式）打开分享链接
11. 点击"🫂 送拥抱"
12. 回到原浏览器 → 进入 **回声** 页面 → 确认拥抱数+1

#### 广场功能

1. 在卡片页点击"发布到广场"
2. 进入 **广场** → 确认帖子已出现
3. 点击 🤗 点赞按钮 → 确认点赞成功
4. 点击 💬 评论按钮 → 输入评论 → 发送
5. 确认评论显示正常

#### 未登录用户浏览广场

1. 在无痕模式打开应用
2. 不选择身份，直接进入 **广场**
3. 确认可以正常浏览帖子
4. 尝试点赞 → 确认弹出"先选个身份吧"提示
5. 点击"去选身份" → 确认跳转到设置页

---

## 11. 常见问题排查

### Q1: Vercel 部署后白屏

**原因**：SPA 路由未正确配置

**解决**：
1. 检查 `vercel.json` 是否包含 `rewrites` 配置
2. 确认 `rewrites` 中有 `{ "source": "/((?!api/).*)", "destination": "/index.html" }`

### Q2: API 调用返回 500 错误

**原因**：环境变量未正确配置

**解决**：
1. 检查 Vercel 环境变量是否包含所有必需变量
2. 确认变量名拼写正确（特别是 `SUPABASE_SERVICE_ROLE_KEY`，不是 `SUPABASE_KEY`）
3. 查看 Vercel Functions 日志：Dashboard → 你的项目 → Logs → Functions

### Q3: AI 翻译返回本地模板（不是 AI 生成的）

**原因**：OpenRouter API Key 未配置或余额不足

**解决**：
1. 检查 Vercel 环境变量中的 `OPENROUTER_API_KEY`
2. 登录 OpenRouter 检查余额
3. 访问 `/api/health` 确认 `openrouter_configured: true`

### Q4: 广场/评论/点赞功能不工作

**原因**：数据库迁移脚本未执行或不完整

**解决**：
1. 在 Supabase SQL Editor 中重新执行 `supabase_migration.sql`
2. 确认 Table Editor 中能看到 5 张表
3. 检查 RLS 策略是否正确创建

### Q5: 分享链接打不开

**原因**：`APP_BASE_URL` 环境变量未配置

**解决**：
1. 在 Vercel 环境变量中设置 `APP_BASE_URL` 为你的域名
2. 重新部署

### Q6: CORS 错误

**原因**：`ALLOWED_ORIGINS` 未包含当前域名

**解决**：
1. 在 Vercel 环境变量中更新 `ALLOWED_ORIGINS`，包含所有访问域名
2. 格式：`https://huashuo.app,https://www.huashuo.app,http://localhost:3000`
3. 重新部署

### Q7: PWA 无法安装

**原因**：manifest.json 或 service-worker.js 未正确部署

**解决**：
1. 确认 `icons/` 目录下有 PNG 图标文件
2. 确认 `vite.config.js` 中的 `copy-static` 插件正常工作
3. 在浏览器中访问 `/manifest.json`，确认返回正确的 JSON

### Q8: 本地开发时 API 不工作

**原因**：本地开发代理未配置或目标域名不对

**解决**：
1. 检查 `vite.config.js` 中的 `proxy.target` 是否为正确的线上域名
2. 确保线上域名已部署且 API 正常工作
3. 或者直接在本地安装 Vercel CLI 运行 Serverless Functions：
   ```powershell
   npm i -g vercel
   vercel dev
   ```

---

## 12. 费用估算

| 服务 | 费用 | 说明 |
|------|------|------|
| 域名 | ~$10/年 | .app 域名价格（可选，不买也行） |
| Vercel | **免费** | Hobby 版：100GB 带宽/月，100h 函数执行/月 |
| Supabase | **免费** | Free 版：500MB 数据库，1GB 文件存储 |
| OpenRouter | ~$2/月 | 按使用量，每天10条约 $0.1（不充值也能用本地模板） |
| Cloudflare | **免费** | DNS + CDN + SSL 全免费（如使用自定义域名） |
| **合计** | **$0 ~ $12/月** | 使用默认域名完全免费 |

> 💡 **最低成本方案**：不购买域名，使用 Vercel 默认域名（`xxx.vercel.app`），不充值 OpenRouter（使用本地模板），总费用为 **$0**。

---

## 附录：需要保存的关键信息清单

请将以下信息保存到安全的地方（如密码管理器或加密笔记）：

- [ ] Supabase Project URL
- [ ] Supabase service_role key
- [ ] Supabase 数据库密码
- [ ] OpenRouter API Key
- [ ] GitHub Personal Access Token
- [ ] Vercel 账号信息
- [ ] 域名注册商登录信息（如购买了域名）
- [ ] Cloudflare 账号信息（如使用了 Cloudflare）
