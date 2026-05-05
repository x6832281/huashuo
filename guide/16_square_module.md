# 广场模块 - 详细规格说明

## 1. 模块概述

### 1.1 模块名称
广场模块（Square Module）

### 1.2 模块目标
提供公开的心事分享广场，用户可以浏览他人发布的心事，进行点赞和评论互动。

### 1.3 模块定位
作为应用的社交扩展模块，让用户在匿名保护下获得来自陌生人的温暖共鸣。

## 2. 功能需求

### 2.1 核心功能
- **浏览广场**：无需登录即可浏览所有用户发布的心事
- **发布到广场**：用户可将自己的心事发布到广场与他人分享
- **情绪筛选**：按情绪频段（全部/低落/平静/开心）筛选帖子
- **点赞（拥抱）**：对帖子进行点赞，需选择身份后操作，同一设备防重复
- **评论**：对帖子发表评论，需选择身份后操作
- **分页加载**：支持分页加载，每页20条

### 2.2 业务规则
- **浏览无需登录**：所有用户（含未选择身份的用户）均可浏览广场内容
- **互动需身份**：点赞和评论需要用户先选择身份（昵称+emoji）
- **点赞防重复**：同一设备对同一帖子只能点赞一次
- **评论字数限制**：评论内容最长500字符
- **帖子字数限制**：帖子内容最长1000字符
- **限流保护**：点赞60秒内最多20次，评论60秒内最多15次

## 3. 技术实现

### 3.1 技术栈
- **前端框架**：Vue 3 + Pinia
- **后端**：Vercel Serverless Functions（Node.js ESM）
- **数据库**：Supabase（PostgreSQL）
- **防刷**：内存级IP限流

### 3.2 数据库设计

#### 3.2.1 square_posts 表
```sql
CREATE TABLE IF NOT EXISTS square_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES shared_cards(share_id) ON DELETE SET NULL,
  content_text TEXT NOT NULL,
  mood_band SMALLINT NOT NULL CHECK (mood_band IN (0, 1, 2)),
  nickname TEXT NOT NULL DEFAULT '匿名',
  emoji TEXT NOT NULL DEFAULT '🌙',
  hugs_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.2 square_comments 表
```sql
CREATE TABLE IF NOT EXISTS square_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES square_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '匿名',
  emoji TEXT NOT NULL DEFAULT '🌙',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 3.2.3 square_likes 表
```sql
CREATE TABLE IF NOT EXISTS square_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES square_posts(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, device_id)
);
```

### 3.3 API 接口

#### 3.3.1 获取广场信息流
- **路径**：`POST /api/share/feed`
- **参数**：`mood_filter`（可选，0/1/2）、`page`（页码）、`page_size`（每页条数，最大50）
- **返回**：`{ posts, total, page, page_size }`

#### 3.3.2 发布到广场
- **路径**：`POST /api/share/publish`
- **参数**：`content_text`、`mood_band`、`nickname`、`emoji`、`share_id`（可选）
- **返回**：`{ post }`

#### 3.3.3 点赞
- **路径**：`POST /api/share/like`
- **参数**：`post_id`、`device_id`
- **返回**：`{ hugs_count, liked, message }`

#### 3.3.4 获取评论列表
- **路径**：`GET /api/share/comment?post_id=xxx`
- **返回**：`{ comments }`

#### 3.3.5 发表评论
- **路径**：`POST /api/share/comment`
- **参数**：`post_id`、`content`、`nickname`、`emoji`
- **返回**：`{ comment }`

### 3.4 前端组件

#### 3.4.1 SquareView.vue
广场主页面，包含：
- 标题栏（广场 + 副标题）
- 情绪筛选栏（全部/🌧️悲伤/🍃平静/☀️开心）
- 帖子列表（使用 SquarePostItem 组件）
- 分页加载
- 空状态引导

#### 3.4.2 SquarePostItem.vue
帖子卡片组件，包含：
- 用户头像（emoji）+ 昵称 + 情绪标签
- 帖子内容
- 点赞按钮（🤗/🫂 + 计数）
- 评论按钮（💬 + 计数）
- 时间显示
- 展开式评论区（评论列表 + 输入框）

#### 3.4.3 LoginPrompt.vue
登录提示弹窗，当未选择身份的用户尝试点赞/评论时弹出：
- 引导文案"先选个身份吧"
- "去选身份"按钮（跳转设置页）
- "先不了"按钮（关闭弹窗）

### 3.5 状态管理（square.js Store）

```javascript
// 核心状态
posts, loading, hasMore, currentPage, moodFilter, total
commentsMap, loadingComments

// 核心方法
fetchPosts(reset)        // 获取帖子列表
publishPost(params)      // 发布帖子
likePost(postId, deviceId)  // 点赞
fetchComments(postId)    // 获取评论
addComment(postId, params)  // 发表评论
setMoodFilter(value)     // 设置情绪筛选
getDeviceId()            // 获取/生成设备ID
```

## 4. 测试方案

### 4.1 单元测试
- **测试场景**：
  - 广场帖子列表加载
  - 情绪筛选功能
  - 分页加载
  - 点赞功能及防重复
  - 评论功能
  - 未登录时弹出登录提示
  - 限流触发

### 4.2 集成测试
- **测试场景**：
  - 与 Supabase 数据库集成
  - 与身份管理模块集成
  - 与限流模块集成
  - 与卡片模块集成（发布到广场）

## 5. 部署与兼容性

### 5.1 浏览器兼容性
- **支持的浏览器**：
  - Chrome 60+
  - Firefox 55+
  - Safari 12+
  - Edge 79+

### 5.2 响应式设计
- **适配设备**：
  - 移动设备（320px-768px）
  - 平板设备（768px-1024px）
  - 桌面设备（1024px+）

## 6. 风险与应对

### 6.1 风险
- **内容安全**：用户可能发布不当内容
- **刷赞刷评**：恶意用户可能批量操作
- **隐私泄露**：帖子内容可能包含个人信息

### 6.2 应对措施
- **限流保护**：IP级别的点赞/评论频率限制
- **防重复**：设备级别的点赞去重
- **脱敏提示**：前端敏感信息检测提醒（复用树洞模块）
- **内容审核**：后续可接入内容审核API

## 7. 依赖关系

### 7.1 依赖模块
- 身份管理模块（互动功能需要身份）
- API服务模块（Serverless Functions）
- Supabase集成模块
- 防刷限流模块

### 7.2 被依赖模块
- 卡片生成模块（"发布到广场"按钮）

## 8. 验收标准

### 8.1 功能验收
- 未登录可正常浏览广场
- 点赞/评论时弹出登录提示
- 点赞防重复正常
- 评论正常发布和显示
- 情绪筛选功能正常
- 分页加载正常

### 8.2 性能验收
- 广场加载时间 < 2s
- 点赞/评论响应时间 < 1s
- 分页切换流畅无卡顿
