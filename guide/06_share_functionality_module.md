# 分享功能模块 - 详细规格说明

## 1. 模块概述

### 1.1 模块名称
分享功能模块（Share Functionality Module）

### 1.2 模块目标
提供卡片导出、分享和链接生成功能，支持多平台分享。

### 1.3 模块定位
作为应用的分享出口模块，连接用户与外部社交平台。

## 2. 功能需求

### 2.1 核心功能
- **系统分享**：使用Web Share API进行系统级分享
- **图片保存**：将卡片保存为本地图片
- **链接复制**：复制分享链接到剪贴板
- **文案复制**：复制AI诗句到剪贴板
- **分享记录**：记录分享操作

### 2.2 业务规则
- **分享优先级**：优先使用系统分享，不可用时提供兜底方案
- **图片格式**：PNG格式，体积≤300KB，不携带EXIF
- **分享链接**：格式为 `https://<你的域名>/s/<share_id>`
- **用户体验**：操作反馈及时，错误提示友好

## 3. 技术实现

### 3.1 技术栈
- **前端框架**：Vue.js / React
- **Web Share API**：用于系统分享
- **Clipboard API**：用于复制链接和文案
- **File API**：用于保存图片
- **本地存储**：用于记录分享操作

### 3.2 实现方案

#### 3.2.1 核心方法

##### 3.2.2.1 系统分享
```javascript
async function shareViaSystem(cardData, imageBlob) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: '话说APP分享',
        text: cardData.ai_poem,
        url: generateShareLink(cardData.share_id)
      });
      return true;
    } catch (error) {
      // 分享取消或失败
      return false;
    }
  } else {
    // 不支持系统分享，使用兜底方案
    return false;
  }
}
```

##### 3.2.2.2 保存图片
```javascript
function saveImage(imageBlob) {
  const url = URL.createObjectURL(imageBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `huashuo_card_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

##### 3.2.2.3 复制链接
```javascript
async function copyShareLink(shareId) {
  const shareLink = generateShareLink(shareId);
  try {
    await navigator.clipboard.writeText(shareLink);
    return true;
  } catch (error) {
    // 降级方案
    return false;
  }
}
```

##### 3.2.2.4 复制文案
```javascript
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // 降级方案
    return false;
  }
}
```

##### 3.2.2.5 记录分享操作
```javascript
function recordShareAction(cardId, actionType) {
  // 记录分享操作到本地存储
  // 包含时间戳、操作类型等信息
}
```

## 4. 测试方案

### 4.1 单元测试
- **测试场景**：
  - 系统分享功能
  - 图片保存功能
  - 链接复制功能
  - 文案复制功能
  - 分享记录功能
  - 错误处理正确

### 4.2 集成测试
- **测试场景**：
  - 与卡片生成模块集成
  - 与后端分享API集成

### 4.3 兼容性测试
- **测试场景**：
  - 不同浏览器的系统分享支持情况
  - 不同设备的分享体验
  - 微信内置浏览器的分享行为

## 5. 部署与兼容性

### 5.1 浏览器兼容性
- **支持的浏览器**：
  - Chrome 60+
  - Firefox 55+
  - Safari 12+
  - Edge 79+

### 5.2 设备兼容性
- **适配设备**：
  - 移动设备
  - 平板设备
  - 桌面设备

### 5.3 平台兼容性
- **支持的平台**：
  - 微信
  - 小红书
  - 微博
  - 其他社交平台

## 6. 风险与应对

### 6.1 风险
- **系统分享不可用**：部分浏览器或设备不支持Web Share API
- **复制功能失败**：Clipboard API不可用
- **图片保存失败**：File API操作失败
- **分享链接无效**：share_id不存在或已失效

### 6.2 应对措施
- **兜底方案**：提供多种分享方式，确保至少有一种可用
- **错误处理**：捕获并处理所有可能的错误，提供友好提示
- **链接验证**：分享前验证链接有效性

## 7. 依赖关系

### 7.1 依赖模块
- 卡片生成模块
- 后端分享API

### 7.2 被依赖模块
- 无

## 8. 开发计划

### 8.1 开发步骤
1. 实现系统分享功能
2. 实现图片保存功能
3. 实现链接复制功能
4. 实现文案复制功能
5. 实现分享记录功能
6. 编写测试用例
7. 集成测试

### 8.2 预期完成时间
- **估计时间**：1周
- **关键路径**：系统分享和兜底方案实现

## 9. 验收标准

### 9.1 功能验收
- 系统分享功能正常
- 图片保存功能正常
- 链接复制功能正常
- 文案复制功能正常
- 分享记录功能正常
- 兜底方案有效

### 9.2 性能验收
- 分享操作响应时间 < 1s
- 图片保存时间 < 2s
- 操作流畅无卡顿

### 9.3 兼容性验收
- 在支持的浏览器中正常工作
- 在微信内置浏览器中可用
- 在不同设备上表现一致