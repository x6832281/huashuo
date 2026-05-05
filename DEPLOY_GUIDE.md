# 话说APP 上线手动步骤详细指南

> 本文档面向新人，每一步都包含截图位置描述、点击路径、输入内容。
> 预计完成时间：2-3小时（不含域名审核等待时间）

---

## 目录

1. [注册 Supabase 并创建数据库](#1-注册-supabase-并创建数据库)
2. [注册 OpenRouter 并获取 API Key](#2-注册-openrouter-并获取-api-key)
3. [注册域名并配置 DNS](#3-注册域名并配置-dns)
4. [将代码推送到 GitHub](#4-将代码推送到-github)
5. [部署前端到 Vercel](#5-部署前端到-vercel)
6. [部署后端到 Heroku](#6-部署后端到-heroku)
7. [配置 GitHub Secrets（CI/CD 自动部署）](#7-配置-github-secretscicd-自动部署)
8. [生成 PWA 图标](#8-生成-pwa-图标)
9. [最终验证清单](#9-最终验证清单)

---

## 1. 注册 Supabase 并创建数据库

Supabase 是一个云端数据库服务，用来存储分享卡片和拥抱计数数据。

### 1.1 注册账号

1. 打开浏览器，访问 https://supabase.com
2. 点击页面右上角 **"Start your project"** 按钮
3. 选择 **"Sign in with GitHub"**（如果你已有 GitHub 账号，推荐这种方式）
4. 如果没有 GitHub 账号，先去 https://github.com 注册一个
5. 授权 Supabase 访问你的 GitHub 账号
6. 补充你的信息：组织名称填 `huashuo`，点击 **"Complete setup"**

### 1.2 创建项目

1. 登录后，点击 **"New Project"** 按钮
2. 填写项目信息：
   - **Name**：`huashuo-app`
   - **Database Password**：点击 **"Generate a password"** 自动生成，**⚠️ 把这个密码复制保存到安全的地方**（比如记事本，标注为"Supabase数据库密码"）
   - **Region**：选择 **Northeast Asia (Tokyo)** 或 **Southeast Asia (Singapore)**（离中国最近的区域）
   - **Plan**：选择 **Free**（免费版，足够使用）
3. 点击 **"Create new project"** 按钮
4. 等待约 2 分钟，项目创建完成

### 1.3 获取连接信息

1. 项目创建完成后，在左侧菜单点击 **"Settings"**（齿轮图标）
2. 点击 **"API"** 选项卡
3. 找到以下两个值，**复制保存**：
   - **Project URL**：类似 `https://xxxxx.supabase.co`（这就是 `SUPABASE_URL`）
   - **service_role key**：点击 "Reveal" 显示，类似 `eyJhbGci...`（这就是 `SUPABASE_KEY`）
4. ⚠️ **注意**：service_role key 拥有完全权限，绝对不能公开分享或提交到代码仓库

### 1.4 执行数据库迁移脚本

1. 在 Supabase 左侧菜单点击 **"SQL Editor"**（SQL图标）
2. 点击 **"New query"** 按钮
3. 打开项目中的文件 `api/supabase_migration.sql`，全选复制内容
4. 粘贴到 SQL 编辑器中
5. 点击右下角 **"Run"** 按钮（或按 Ctrl+Enter）
6. 看到绿色提示 "Success" 表示执行成功
7. 你可以点击左侧 **"Table Editor"** 验证：应该能看到 `shared_cards` 表

### 1.5 验证表结构

在 SQL Editor 中运行以下查询验证：

```sql
SELECT * FROM shared_cards LIMIT 1;
```

如果没有报错（返回空结果即可），说明表创建成功。

---

## 2. 注册 OpenRouter 并获取 API Key

OpenRouter 是 AI 模型代理服务，用来调用 GPT-4o 进行情绪翻译。

### 2.1 注册账号

1. 打开浏览器，访问 https://openrouter.ai
2. 点击右上角 **"Sign In"** 按钮
3. 选择 **"Continue with GitHub"**（用 GitHub 账号登录最方便）
4. 授权 OpenRouter 访问你的 GitHub 账号

### 2.2 充值（可选但推荐）

OpenRouter 按使用量付费。GPT-4o 大约 $2.5/百万 token。

1. 登录后，点击右上角你的头像
2. 点击 **"Credits"**
3. 点击 **"Add Credits"**
4. 建议先充值 **$5** 试试（约可翻译 2000 条心事）
5. 选择支付方式（支持信用卡），完成支付

### 2.3 创建 API Key

1. 点击右上角你的头像，选择 **"Keys"**
2. 点击 **"Create Key"** 按钮
3. **Name**：填 `huashuo-app`
4. **Limit**：可以不填（不限制额度）
5. 点击 **"Create"**
6. ⚠️ **立即复制并保存这个 Key**（类似 `sk-or-v1-xxxxx`），关闭窗口后无法再查看
7. 保存为 `OPENROUTER_API_KEY`

---

## 3. 注册域名并配置 DNS

### 3.1 选择域名注册商

推荐以下注册商（选一个即可）：

| 注册商 | 价格 | 优点 |
|--------|------|------|
| Cloudflare (推荐) | ~$10/年 | 免费CDN+SSL，DNS解析快 |
| Namesilo | ~$9/年 | 便宜，免费隐私保护 |
| 阿里云 | ~$55/年 | 中文界面，国内访问快 |

### 3.2 以 Cloudflare 为例注册域名

1. 打开 https://www.cloudflare.com
2. 点击 **"Sign Up"** 注册账号
3. 登录后，在搜索框输入 `huashuo.app`
4. 如果可用，点击 **"Purchase"** 购买
5. 填写注册信息，完成支付
6. 域名购买后，Cloudflare 会自动成为你的 DNS 服务商

### 3.3 配置 DNS 记录

1. 在 Cloudflare 仪表板，点击你的域名 `huashuo.app`
2. 点击左侧 **"DNS"** → **"Records"**
3. 添加以下 DNS 记录：

| 类型 | 名称 | 内容 | 代理状态 | TTL |
|------|------|------|----------|-----|
| CNAME | `www` | `cname.vercel-dns.com` | 开启代理(橙色云) | Auto |
| CNAME | `@` | `cname.vercel-dns.com` | 开启代理(橙色云) | Auto |
| CNAME | `api` | `你的heroku应用名.herokuapp.com` | 开启代理(橙色云) | Auto |

4. 每条记录的添加方式：
   - 点击 **"Add record"** 按钮
   - 选择 **Type**（如 CNAME）
   - 填写 **Name**（如 `www`）
   - 填写 **Target**（如 `cname.vercel-dns.com`）
   - **Proxy status** 开启（橙色云朵图标）
   - 点击 **"Save"**

### 3.4 配置 SSL 证书

1. 在 Cloudflare 左侧点击 **"SSL/TLS"**
2. **Overview** 选项卡中，加密模式选择 **"Full (strict)"**
3. 在 **"Edge Certificates"** 选项卡中：
   - 确保 **"Always Use HTTPS"** 开启
   - 确保 **"Automatic HTTPS Rewrites"** 开启
   - 确保 **"Minimum TLS Version"** 为 TLS 1.2

---

## 4. 将代码推送到 GitHub

### 4.1 安装 Git

1. 下载 Git：https://git-scm.com/download/win
2. 双击安装，一路 Next 即可（默认选项）
3. 安装完成后，打开 PowerShell 验证：
   ```
   git --version
   ```
   应显示类似 `git version 2.43.0`

### 4.2 配置 Git 用户信息

在 PowerShell 中运行：
```
git config --global user.name "你的GitHub用户名"
git config --global user.email "你的GitHub邮箱"
```

### 4.3 创建 GitHub 仓库

1. 打开 https://github.com
2. 点击右上角 **"+"** → **"New repository"**
3. 填写：
   - **Repository name**：`huashuo`
   - **Description**：`话说APP - 零压力匿名情绪记录与加密分享工具`
   - **可见性**：选择 **Public**（公开，才能使用免费的 Vercel/Netlify）
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
git commit -m "话说APP V1.0 完整代码"

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

## 5. 部署前端到 Vercel

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
4. 点击 **"Deploy"** 按钮
5. 等待约 1-2 分钟，部署完成
6. 🎉 你会看到一个部署成功的庆祝动画

### 5.3 配置自定义域名

1. 部署完成后，点击 **"Continue to Dashboard"**
2. 点击 **"Settings"** 选项卡
3. 左侧点击 **"Domains"**
4. 输入 `huashuo.app`，点击 **"Add"**
5. Vercel 会显示需要添加的 DNS 记录（CNAME 指向 `cname.vercel-dns.com`）
6. 如果之前已在 Cloudflare 配置了，Vercel 会自动验证
7. 同时添加 `www.huashuo.app`
8. 验证通过后，Vercel 会自动配置 SSL 证书

### 5.4 验证前端部署

1. 在浏览器打开 `https://huashuo.app`
2. 应该能看到话说APP的首页
3. 如果看到白屏，按 F12 打开开发者工具，查看 Console 是否有错误

---

## 6. 部署后端到 Heroku

### 6.1 注册 Heroku

1. 打开 https://www.heroku.com
2. 点击 **"Sign up"**
3. 填写信息，选择 **"Student"** 或 **"Personal"**
4. 验证邮箱

### 6.2 创建应用

1. 登录后，点击 **"New"** → **"Create new app"**
2. **App name**：`huashuo-api`（如果被占用，加数字如 `huashuo-api-1`）
3. **Region**：选择 **United States**
4. 点击 **"Create app"**
5. ⚠️ 记住你的 App name，后面要用

### 6.3 连接 GitHub 仓库

1. 在应用页面，点击 **"Deploy"** 选项卡
2. **Deployment method** 选择 **"GitHub"**
3. 点击 **"Connect to GitHub"**，授权 Heroku 访问
4. 搜索 `huashuo` 仓库，点击 **"Connect"**
5. ⚠️ **重要**：在搜索框下方，有一个 **"App directory"** 输入框，填入 `api`（因为后端代码在 `api/` 子目录中）
6. 勾选 **"Enable Automatic Deploys"**（推送代码自动部署）
7. 点击 **"Deploy Branch"**（手动部署一次）

### 6.4 配置环境变量

1. 点击 **"Settings"** 选项卡
2. 找到 **"Config Vars"** 部分，点击 **"Reveal Config Vars"**
3. 逐个添加以下变量（KEY 填左边，VALUE 填右边）：

| KEY | VALUE | 来源 |
|-----|-------|------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | 步骤 1.3 |
| `SUPABASE_KEY` | `eyJhbGci...` | 步骤 1.3 |
| `OPENROUTER_API_KEY` | `sk-or-v1-xxxxx` | 步骤 2.3 |
| `SECRET_KEY` | 随机32位字符串 | 见下方生成方法 |
| `ALLOWED_ORIGINS` | `https://huashuo.app,https://www.huashuo.app` | 你的域名 |

4. 生成 SECRET_KEY 的方法：在 PowerShell 中运行
   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   复制输出的字符串

5. 每添加一个变量：输入 KEY → 输入 VALUE → 点击 **"Add"**

### 6.5 验证后端部署

1. 在 Heroku 应用页面右上角，点击 **"Open app"**
2. 浏览器会打开 `https://huashuo-api.herokuapp.com`
3. 应该看到类似 `{"message": "话说APP API服务", "version": "1.0.0"}` 的 JSON
4. 访问 `https://huashuo-api.herokuapp.com/health`
5. 应该看到 `{"status": "healthy"}`

---

## 7. 配置 GitHub Secrets（CI/CD 自动部署）

配置后，每次推送代码到 main 分支会自动部署。

### 7.1 前端 CI/CD（GitHub Pages）

前端已配置 Vercel 自动部署，无需额外配置 GitHub Secrets。
每次推送到 `main` 分支（非 `api/` 目录的改动），Vercel 会自动重新部署。

### 7.2 后端 CI/CD（Heroku）

1. 打开 GitHub 仓库页面：`https://github.com/你的用户名/huashuo`
2. 点击 **"Settings"** 选项卡
3. 左侧点击 **"Secrets and variables"** → **"Actions"**
4. 点击 **"New repository secret"** 按钮
5. 逐个添加以下 Secret：

| Name | Value | 来源 |
|------|-------|------|
| `HEROKU_API_KEY` | Heroku API Key | 见下方获取方法 |
| `HEROKU_APP_NAME` | `huashuo-api` | 步骤 6.2 |
| `HEROKU_EMAIL` | 你的 Heroku 注册邮箱 | 注册邮箱 |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | 步骤 1.3 |
| `SUPABASE_KEY` | `eyJhbGci...` | 步骤 1.3 |
| `OPENROUTER_API_KEY` | `sk-or-v1-xxxxx` | 步骤 2.3 |
| `SECRET_KEY` | 随机32位字符串 | 步骤 6.4 |
| `ALLOWED_ORIGINS` | `https://huashuo.app,https://www.huashuo.app` | 你的域名 |

6. 获取 Heroku API Key 的方法：
   - 登录 https://dashboard.heroku.com
   - 点击右上角头像 → **"Account settings"**
   - 滚动到底部 **"API Key"** 部分
   - 点击 **"Reveal"**，复制并保存

---

## 8. 生成 PWA 图标

当前 `icons/` 目录为空，需要生成各尺寸的 PNG 图标。

### 8.1 准备一张 512x512 的源图标

1. 使用任意图片编辑工具（推荐免费在线工具 https://www.figma.com 或 https://www.canva.com）
2. 创建一个 512×512 像素的画布
3. 设计图标（建议使用"话说"文字 + 深色背景 + 暖金色文字）
4. 导出为 PNG 格式，保存为 `icon-512x512.png`

### 8.2 生成多尺寸图标

1. 访问 https://www.pwabuilder.com/imageCreator
2. 上传你的 512×512 图标
3. 选择 **"Generate"**
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

### 8.3 重新构建和部署

```powershell
cd e:\learning\web\260406\whisper
npm run build
git add .
git commit -m "添加PWA图标"
git push
```

推送后 Vercel 会自动重新部署。

---

## 9. 最终验证清单

完成所有步骤后，逐项验证：

### 9.1 前端验证

| # | 验证项 | 操作 | 期望结果 |
|---|--------|------|----------|
| 1 | 首页可访问 | 浏览器打开 `https://huashuo.app` | 看到话说APP首页 |
| 2 | HTTPS 正常 | 查看地址栏 | 有锁头图标 |
| 3 | SPA 路由 | 点击底部"树洞"Tab | 页面切换，不刷新 |
| 4 | PWA 安装 | Chrome 地址栏右侧 | 出现"安装"图标 |
| 5 | 离线访问 | 安装PWA后断网打开 | 页面可显示（缓存） |

### 9.2 后端验证

| # | 验证项 | 操作 | 期望结果 |
|---|--------|------|----------|
| 1 | 健康检查 | 访问 `https://api.huashuo.app/health` | `{"status":"healthy"}` |
| 2 | AI翻译 | 用 Postman/curl POST `/api/ai/translate` | 返回诗句+表情包 |
| 3 | 创建分享 | POST `/api/share/create` | 返回 share_id |
| 4 | 送拥抱 | POST `/api/share/hug` | 返回 hugs_count |
| 5 | CORS | 从 huashuo.app 前端调用 API | 正常返回 |

### 9.3 完整闭环验证

1. 打开 `https://huashuo.app`
2. 创建一个身份（如"小明😊"）
3. 写下一条心事（如"今天有点累"）
4. 点击"AI翻译"，等待诗句生成
5. 选择一个表情包，点击"生成卡片"
6. 查看卡片预览（含诗句+二维码）
7. 点击"分享卡片"，复制链接
8. 在另一个浏览器（或无痕模式）打开分享链接
9. 点击"送拥抱"
10. 回到原浏览器，查看"回声"页面，拥抱数应该+1

---

## 常见问题排查

### Q1: Vercel 部署后白屏

**原因**：SPA 路由未正确配置

**解决**：
1. 检查 `vercel.json` 是否包含 `rewrites` 配置
2. 在 Vercel 的 Settings → Functions 中确认路由重写

### Q2: Heroku 部署失败

**原因**：`api/` 子目录未被正确识别

**解决**：
1. 确认 Heroku 的 App directory 设置为 `api`
2. 或在项目根目录创建 `Procfile`，内容为：
   ```
   web: cd api && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### Q3: API 调用返回 CORS 错误

**原因**：后端 CORS 未包含你的域名

**解决**：
1. 在 Heroku Config Vars 中更新 `ALLOWED_ORIGINS`
2. 确保格式为 `https://huashuo.app,https://www.huashuo.app`（逗号分隔，无空格）

### Q4: AI 翻译返回降级模板

**原因**：OpenRouter API Key 未配置或余额不足

**解决**：
1. 检查 Heroku Config Vars 中的 `OPENROUTER_API_KEY`
2. 登录 OpenRouter 检查余额

### Q5: 二维码扫不开

**原因**：域名未正确解析

**解决**：
1. 在终端运行 `nslookup huashuo.app` 检查 DNS
2. 确认 Cloudflare DNS 记录正确
3. 等待 DNS 传播（最多 48 小时）

---

## 费用估算

| 服务 | 费用 | 说明 |
|------|------|------|
| 域名 | ~$10/年 | .app 域名价格 |
| Supabase | 免费 | 免费版 500MB 存储，足够 |
| OpenRouter | ~$2/月 | 按使用量，每天10条约 $0.1 |
| Vercel | 免费 | 免费版 100GB 带宽/月 |
| Heroku | 免费 | Eco dyno $5/月，或用免费替代 |
| Cloudflare | 免费 | DNS + CDN + SSL 全免费 |
| **合计** | **~$17/月** | 含域名摊销 |

---

## 需要保存的关键信息清单

请将以下信息保存到安全的地方（如密码管理器或加密笔记）：

- [ ] Supabase Project URL
- [ ] Supabase service_role key
- [ ] Supabase 数据库密码
- [ ] OpenRouter API Key
- [ ] Heroku API Key
- [ ] SECRET_KEY
- [ ] GitHub Personal Access Token
- [ ] 域名注册商登录信息
- [ ] Cloudflare 账号信息
