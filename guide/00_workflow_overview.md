# 话说APP 工作流说明

## 1. 概述

本文档描述话说APP的完整用户工作流，涵盖从心事记录到社交分享的全流程。

### 1.1 核心工作流

```
写下心事（首页） → 存入树洞 → 选择一件心事 → 生成AI卡片 → 发到广场/分享
                   ↑                         ↓
               树洞列表        回声（温暖反馈）
```

### 1.2 工作流阶段

| 阶段 | 页面 | 核心动作 | 数据流向 |
|------|------|---------|---------|
| ① 记录 | 首页 | 写下心事 | 本地存储 |
| ② 管理 | 树洞 | 浏览/筛选/管理心事 | 本地存储 |
| ③ 转化 | 卡片 | AI生成诗句+卡片 | 本地 + Supabase |
| ④ 分享 | 卡片/广场 | 分享到社交平台/发布到广场 | Supabase |
| ⑤ 反馈 | 回声 | 查看拥抱和评论 | Supabase |

## 2. 详细工作流

### 2.1 阶段一：记录心事

**入口**：首页（心事页）

**流程**：
1. 打开话说APP，进入首页
2. 点击"✍️ 写下心事"按钮
3. 在弹出的表单中输入心事内容（1-1000字）
4. 系统自动检测敏感信息（手机号/邮箱/身份证号）并提醒
5. 系统自动分析情绪频段（🌧️低落 / 🌤️平静 / ☀️开心）
6. 提交后心事存入本地存储

**数据结构**：
```javascript
{
  id: string,
  identity_id: string,       // 当前身份ID
  mood_band_ai: number,      // AI识别的情绪频段
  mood_band_final: number,   // 最终情绪频段（可纠错1次）
  mood_band_edit_count: 0,   // 纠错次数
  content_text: string,      // 心事原文
  created_at: number,
  archived_at: null,
  deleted_at: null
}
```

**涉及文件**：
- [HomeView.vue](file:///e:/learning/web/260406/whisper/src/views/HomeView.vue) - 首页
- [PostCreateForm.vue](file:///e:/learning/web/260406/whisper/src/components/PostCreateForm.vue) - 发布表单
- [emotionTreeHole.js](file:///e:/learning/web/260406/whisper/src/emotion/emotionTreeHole.js) - 核心业务模块

---

### 2.2 阶段二：管理心事（树洞）

**入口**：底部导航栏"🌳 树洞"

**流程**：
1. 进入树洞页面，查看所有已记录的心事
2. 可按情绪频段筛选：全部 / 🌧️低落 / 🌤️波动 / ☀️轻松
3. 可对心事进行管理：
   - **归档**：暂时收起心事（可恢复）
   - **删除**：永久删除心事（不可恢复）
   - **纠错**：修改情绪频段（仅限1次，修改后锁定）
4. 点击心事可查看详情，进入卡片生成流程

**涉及文件**：
- [TreeHoleView.vue](file:///e:/learning/web/260406/whisper/src/views/TreeHoleView.vue) - 树洞页面
- [PostListItem.vue](file:///e:/learning/web/260406/whisper/src/components/PostListItem.vue) - 心事列表项
- [emotion.js](file:///e:/learning/web/260406/whisper/src/stores/emotion.js) - 状态管理

---

### 2.3 阶段三：生成AI卡片

**入口**：树洞中选择一件心事 / 底部导航栏"🎴 卡片"

**流程**：
1. 选择一件心事后，进入卡片页面
2. 点击"生成卡片"按钮
3. 系统调用 AI API（OpenRouter / GPT-4o）将心事"翻译"为：
   - **AI诗句**（≤15字）：文案、诗句、热梗、名言、书摘等多种风格
   - **表情包文案**：安慰型/吃瓜型/损友型各一条
4. AI失败时降级到本地模板（10条预设文案 × 3个情绪档位）
5. 使用 Canvas 绘制精美卡片：
   - 卡片背景（根据情绪频段选色）
   - AI诗句文字
   - 底部二维码（指向分享落地页）
6. 卡片预览，可切换表情包风格

**涉及文件**：
- [CardView.vue](file:///e:/learning/web/260406/whisper/src/views/CardView.vue) - 卡片页面
- [api/ai/translate.js](file:///e:/learning/web/260406/whisper/api/ai/translate.js) - AI翻译API

---

### 2.4 阶段四：分享

卡片生成后有两种分享方式：

#### 2.4.1 外部分享（微信/小红书等）

**流程**：
1. 点击"分享"按钮
2. 系统调用 Web Share API 分享图片
3. 如果系统分享不可用，降级为：
   - 保存图片到本地
   - 复制分享链接
   - 复制文案
4. 分享内容包含：AI诗句卡片 + 二维码
5. 系统在 Supabase 创建分享记录（share_id, ai_poem, mood_band）

**涉及文件**：
- [ShareLandingView.vue](file:///e:/learning/web/260406/whisper/src/views/ShareLandingView.vue) - 分享落地页
- [api/share/create.js](file:///e:/learning/web/260406/whisper/api/share/create.js) - 创建分享

#### 2.4.2 发布到广场

**流程**：
1. 点击"发布到广场"按钮
2. 系统将心事内容发布到广场（Supabase square_posts 表）
3. 帖子立即出现在广场列表中
4. 其他用户可以浏览、点赞、评论

**涉及文件**：
- [api/share/publish.js](file:///e:/learning/web/260406/whisper/api/share/publish.js) - 发布API
- [SquareView.vue](file:///e:/learning/web/260406/whisper/src/views/SquareView.vue) - 广场页面
- [square.js](file:///e:/learning/web/260406/whisper/src/stores/square.js) - 广场状态管理

---

### 2.5 阶段五：广场互动

**入口**：底部导航栏"🌌 广场"

**流程**：
1. 进入广场，浏览所有用户发布的心事（无需登录）
2. 可按情绪频段筛选（全部/悲伤/平静/开心）
3. 点赞互动：
   - 未选择身份 → 弹出登录提示 → 前往设置页选择身份
   - 已有身份 → 点击 🤗 按钮完成点赞（同一设备只能点赞一次）
4. 评论互动：
   - 未选择身份 → 弹出登录提示
   - 已有身份 → 展开评论区 → 输入评论 → 发送

**涉及文件**：
- [SquareView.vue](file:///e:/learning/web/260406/whisper/src/views/SquareView.vue) - 广场页面
- [SquarePostItem.vue](file:///e:/learning/web/260406/whisper/src/components/SquarePostItem.vue) - 帖子组件
- [LoginPrompt.vue](file:///e:/learning/web/260406/whisper/src/components/LoginPrompt.vue) - 登录提示
- [api/share/like.js](file:///e:/learning/web/260406/whisper/api/share/like.js) - 点赞API
- [api/share/comment.js](file:///e:/learning/web/260406/whisper/api/share/comment.js) - 评论API

---

### 2.6 阶段六：回声反馈

**入口**：底部导航栏"💫 回声"

**流程**：
1. 进入回声页面，查看已分享卡片的反馈
2. 系统批量拉取分享卡片的拥抱计数（api/share/batch）
3. 显示每张卡片收到的拥抱数量
4. 当有新拥抱时，显示"🫂 收到X个拥抱"的通知提示
5. 冷启动时自动拉取最新拥抱数据

**涉及文件**：
- [EchoView.vue](file:///e:/learning/web/260406/whisper/src/views/EchoView.vue) - 回声页面
- [HugNotification.vue](file:///e:/learning/web/260406/whisper/src/components/HugNotification.vue) - 拥抱通知
- [api/share/batch.js](file:///e:/learning/web/260406/whisper/api/share/batch.js) - 批量拉取API
- [api/share/hug.js](file:///e:/learning/web/260406/whisper/api/share/hug.js) - 拥抱API

---

## 3. 外部用户互动流程

当分享卡片被发送到微信/小红书后，外部用户的互动流程：

```
熟人看到分享卡片 → 扫描二维码 → 打开分享落地页 → 看到AI诗句 → 点击"送出拥抱"
```

**涉及文件**：
- [ShareLandingView.vue](file:///e:/learning/web/260406/whisper/src/views/ShareLandingView.vue) - 分享落地页
- [api/share/hug.js](file:///e:/learning/web/260406/whisper/api/share/hug.js) - 拥抱API

---

## 4. 完整页面导航结构

```
┌─────────────────────────────────────────┐
│              话说APP                      │
├────────┬────────┬────────┬────────┬──────┤
│  🌙    │  🌳    │  🎴    │  🌌    │  💫  │  ⚙️
│  心事   │  树洞   │  卡片   │  广场   │  回声 │  设置
├────────┴────────┴────────┴────────┴──────┤
│                                          │
│  心事（首页）                              │
│  ├── 写下心事 → 弹出发布表单                │
│  ├── 最近心事列表（最近5条）                 │
│  └── 统计数据（心事数/卡片数/拥抱数）         │
│                                          │
│  树洞                                    │
│  ├── 情绪筛选（全部/低落/波动/轻松）          │
│  ├── 心事列表                              │
│  └── 心事操作（归档/删除/纠错）              │
│                                          │
│  卡片                                    │
│  ├── 选择心事 → AI生成诗句                  │
│  ├── 卡片预览（可切换表情包风格）             │
│  ├── 导出图片/分享                          │
│  └── 发布到广场                            │
│                                          │
│  广场（无需登录浏览）                       │
│  ├── 情绪筛选（全部/悲伤/平静/开心）          │
│  ├── 帖子列表                              │
│  ├── 点赞（🤗 需身份）                      │
│  └── 评论（💬 需身份）                      │
│                                          │
│  回声                                    │
│  ├── 已分享卡片列表                         │
│  ├── 拥抱计数                              │
│  └── 新拥抱通知                            │
│                                          │
│  设置                                    │
│  ├── 身份管理（创建/切换/归档）               │
│  ├── 隐私说明                              │
│  ├── 数据导出/清理                          │
│  └── 反馈入口                              │
│                                          │
└──────────────────────────────────────────┘
```

---

## 5. 技术架构

### 5.1 前端架构
- **框架**：Vue 3 + Vite
- **状态管理**：Pinia
- **路由**：Vue Router（Hash模式）
- **PWA**：Service Worker + Web App Manifest

### 5.2 后端架构
- **运行时**：Vercel Serverless Functions（Node.js ESM）
- **数据库**：Supabase（PostgreSQL）
- **AI服务**：OpenRouter API（GPT-4o）
- **限流**：内存级IP限流

### 5.3 API 端点清单

| 端点 | 方法 | 功能 | 限流 |
|------|------|------|------|
| `/api/ai/translate` | POST | AI情绪翻译 | 5次/分 |
| `/api/share/create` | POST | 创建分享卡片 | 10次/分 |
| `/api/share/hug` | POST | 送出拥抱 | 3次/分 |
| `/api/share/batch` | POST | 批量获取拥抱数 | 5次/分 |
| `/api/share/publish` | POST | 发布到广场 | 5次/分 |
| `/api/share/feed` | GET/POST | 获取广场信息流 | 30次/分 |
| `/api/share/comment` | GET/POST | 评论功能 | 15次/分 |
| `/api/share/like` | POST | 点赞功能 | 20次/分 |
| `/api/health` | GET | 健康检查 | 无 |

### 5.4 数据存储

| 存储位置 | 数据类型 | 说明 |
|---------|---------|------|
| 浏览器本地（IndexedDB） | 心事原文、身份信息 | 离线可用，仅自己可见 |
| Supabase | 分享卡片、广场帖子、拥抱、评论、点赞 | 云端持久化，公开可见 |
