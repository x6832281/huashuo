# 分享功能模块使用说明

## 1. 模块介绍

分享功能模块（Share Functionality Module）是话说APP的分享出口模块，提供卡片导出、分享和链接生成功能，支持多平台分享。

### 核心特性

- **系统分享**：使用Web Share API进行系统级分享
- **图片保存**：将卡片保存为本地PNG图片
- **链接复制**：复制分享链接到剪贴板
- **文案复制**：复制AI诗句到剪贴板
- **分享记录**：记录分享操作
- **兜底方案**：当系统分享不可用时提供备选方案

## 2. 安装方法

### 2.1 引入模块

在 Node.js 环境中：

```javascript
const shareFunctionalityModule = require('./src/share/shareFunctionality');
```

在浏览器环境中：

```html
<script src="path/to/shareFunctionality.js"></script>
```

### 2.2 依赖模块

分享功能模块依赖于以下模块：

```javascript
const localStorageModule = require('../storage/localStorage');
```

## 3. 核心功能使用

### 3.1 系统分享

```javascript
const shared = await shareFunctionalityModule.shareViaSystem(cardData, imageBlob);
if (shared) {
  console.log('系统分享成功');
} else {
  console.log('系统分享失败或不可用');
}
```

**参数说明**：
- `cardData`：卡片数据，包含 `id`、`share_id`、`ai_poem` 等字段
- `imageBlob`：卡片图片的Blob对象（可选）

**返回**：布尔值，表示是否成功使用系统分享

### 3.2 保存图片

```javascript
const success = shareFunctionalityModule.saveImage(imageBlob);
if (success) {
  console.log('图片保存成功');
} else {
  console.log('图片保存失败');
}
```

**参数说明**：
- `imageBlob`：卡片图片的Blob对象

**返回**：布尔值，表示是否成功保存图片

### 3.3 复制分享链接

```javascript
const success = await shareFunctionalityModule.copyShareLink(shareId);
if (success) {
  console.log('分享链接复制成功');
} else {
  console.log('分享链接复制失败');
}
```

**参数说明**：
- `shareId`：卡片的分享ID

**返回**：布尔值，表示是否成功复制链接

### 3.4 复制文案

```javascript
const success = await shareFunctionalityModule.copyText(cardData.ai_poem);
if (success) {
  console.log('文案复制成功');
} else {
  console.log('文案复制失败');
}
```

**参数说明**：
- `text`：要复制的文案（如AI诗句）

**返回**：布尔值，表示是否成功复制文案

### 3.5 生成分享链接

```javascript
const shareLink = shareFunctionalityModule.generateShareLink(shareId);
console.log('分享链接:', shareLink);
```

**参数说明**：
- `shareId`：卡片的分享ID

**返回**：分享链接字符串

### 3.6 记录分享操作

```javascript
shareFunctionalityModule.recordShareAction(cardId, 'system');
console.log('分享操作已记录');
```

**参数说明**：
- `cardId`：卡片ID
- `actionType`：操作类型（如 'system'、'saveImage'、'copyLink' 等）

### 3.7 获取分享记录

```javascript
// 获取指定卡片的分享记录
const cardRecords = await shareFunctionalityModule.getShareRecords(cardId);
console.log('卡片分享记录:', cardRecords);

// 获取所有分享记录
const allRecords = await shareFunctionalityModule.getShareRecords();
console.log('所有分享记录:', allRecords);
```

**参数说明**：
- `cardId`：卡片ID（可选）

**返回**：分享记录数组

### 3.8 分享卡片（带兜底方案）

```javascript
const result = await shareFunctionalityModule.shareCard(cardData, imageBlob);
if (result.success) {
  console.log('分享成功，使用方法:', result.method);
} else {
  console.log('系统分享不可用，使用兜底方案');
  const fallbackResult = await shareFunctionalityModule.shareWithFallback(cardData, imageBlob);
  if (fallbackResult.success) {
    console.log('兜底分享成功，分享链接:', fallbackResult.shareLink);
  }
}
```

**参数说明**：
- `cardData`：卡片数据
- `imageBlob`：卡片图片的Blob对象（可选）

**返回**：分享结果对象

### 3.9 兜底分享

```javascript
const result = await shareFunctionalityModule.shareWithFallback(cardData, imageBlob);
if (result.success) {
  console.log('兜底分享成功');
  console.log('分享链接:', result.shareLink);
  console.log('复制链接:', result.copyLinkSuccess ? '成功' : '失败');
  console.log('复制文案:', result.copyTextSuccess ? '成功' : '失败');
} else {
  console.log('兜底分享失败:', result.error);
}
```

**参数说明**：
- `cardData`：卡片数据
- `imageBlob`：卡片图片的Blob对象（可选）

**返回**：兜底分享结果对象

### 3.10 获取可用的分享方法

```javascript
const methods = shareFunctionalityModule.getShareMethods();
console.log('可用的分享方法:', methods);
```

**返回**：可用分享方法数组

### 3.11 检测分享能力

```javascript
const capabilities = await shareFunctionalityModule.testShareCapabilities();
console.log('分享能力检测结果:', capabilities);
```

**返回**：分享能力检测结果对象

## 4. 数据结构

### 4.1 分享记录对象

```javascript
interface ShareRecord {
  id: string;           // 唯一标识符
  card_id: string;      // 卡片ID
  action_type: string;  // 操作类型
  created_at: number;   // 创建时间戳
}
```

### 4.2 分享能力检测结果

```javascript
interface ShareCapabilities {
  systemShare: boolean; // 是否支持系统分享
  clipboard: boolean;   // 是否支持剪贴板
  saveImage: boolean;   // 是否支持图片保存
}
```

### 4.3 分享结果

```javascript
interface ShareResult {
  success: boolean;     // 是否成功
  method?: string;      // 使用的分享方法
  error?: string;       // 错误信息
}
```

### 4.4 兜底分享结果

```javascript
interface FallbackShareResult {
  success: boolean;        // 是否成功
  shareLink: string;       // 分享链接
  copyLinkSuccess: boolean; // 复制链接是否成功
  copyTextSuccess: boolean; // 复制文案是否成功
  error?: string;          // 错误信息
}
```

## 5. 业务规则

### 5.1 分享优先级

1. **优先使用系统分享**：如果浏览器支持Web Share API，优先使用系统分享
2. **兜底方案**：当系统分享不可用时，使用复制链接和文案的方式

### 5.2 图片规范

- **格式**：PNG格式
- **体积**：≤300KB
- **命名**：`huashuo_card_${timestamp}.png`
- **EXIF**：不携带EXIF信息

### 5.3 分享链接规范

- **格式**：`https://huashuo.app/s/<share_id>`
- **长度**：尽量简短，便于分享
- **有效性**：长期有效

### 5.4 分享记录

- **存储**：使用本地存储记录分享操作
- **内容**：包含卡片ID、操作类型、时间戳
- **用途**：用于分析分享行为和优化用户体验

## 6. 错误处理

模块内置了完善的错误处理机制：

```javascript
try {
  const success = await shareFunctionalityModule.copyShareLink(shareId);
  if (success) {
    console.log('分享链接复制成功');
  } else {
    console.log('分享链接复制失败');
  }
} catch (error) {
  console.error('复制失败:', error.message);
}
```

### 6.1 常见错误

| 错误信息 | 说明 | 处理方式 |
|---------|------|----------|
| 系统分享仅在浏览器环境中可用 | 在非浏览器环境中调用系统分享 | 忽略操作，返回false |
| Web Share API 不可用 | 浏览器不支持系统分享 | 使用兜底方案 |
| 图片保存失败 | File API操作失败 | 提示用户手动截图 |
| 复制功能仅在浏览器环境中可用 | 在非浏览器环境中调用复制功能 | 忽略操作，返回false |
| 剪贴板不可用 | 浏览器不支持Clipboard API | 使用降级方案 |

## 7. 浏览器兼容性

| 浏览器 | 版本要求 | 支持状态 |
|--------|---------|----------|
| Chrome | 60+ | ✅ 完全支持 |
| Firefox | 55+ | ✅ 完全支持 |
| Safari | 12+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |
| 微信内置浏览器 | - | ✅ 支持（使用兜底方案） |

### 7.1 特性支持情况

| 功能 | Chrome | Firefox | Safari | Edge | 微信 |
|------|--------|---------|--------|------|------|
| 系统分享 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 图片保存 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 剪贴板 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 兜底方案 | ✅ | ✅ | ✅ | ✅ | ✅ |

## 8. 完整示例

### 8.1 浏览器环境示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>分享功能示例</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .result { margin: 20px 0; padding: 10px; border: 1px solid #ddd; }
        button { margin: 5px; padding: 10px; }
    </style>
</head>
<body>
    <h1>分享功能示例</h1>
    
    <button onclick="testShare()">测试分享</button>
    <button onclick="testSaveImage()">测试保存图片</button>
    <button onclick="testCopyLink()">测试复制链接</button>
    <button onclick="testCopyText()">测试复制文案</button>
    <button onclick="testShareCapabilities()">测试分享能力</button>
    <button onclick="testShareRecords()">测试分享记录</button>
    
    <div id="result" class="result"></div>

    <script src="src/storage/localStorage.js"></script>
    <script src="src/share/shareFunctionality.js"></script>
    <script>
        const testCardData = {
            id: 'test-card-id-123',
            share_id: 'test-share-id-123',
            ai_poem: '月上柳梢人静时'
        };

        async function testShare() {
            const resultDiv = document.getElementById('result');
            try {
                // 创建测试图片
                const canvas = document.createElement('canvas');
                canvas.width = 300;
                canvas.height = 200;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#f8f9fa';
                ctx.fillRect(0, 0, 300, 200);
                ctx.fillStyle = '#333';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(testCardData.ai_poem, 150, 100);
                
                canvas.toBlob(async (blob) => {
                    const result = await shareFunctionalityModule.shareCard(testCardData, blob);
                    if (result.success) {
                        resultDiv.innerHTML = '<p>分享成功，使用方法: ' + result.method + '</p>';
                    } else {
                        const fallbackResult = await shareFunctionalityModule.shareWithFallback(testCardData, blob);
                        if (fallbackResult.success) {
                            resultDiv.innerHTML = `
                                <p>系统分享不可用，使用兜底方案</p>
                                <p>分享链接: ${fallbackResult.shareLink}</p>
                                <p>复制链接: ${fallbackResult.copyLinkSuccess ? '成功' : '失败'}</p>
                                <p>复制文案: ${fallbackResult.copyTextSuccess ? '成功' : '失败'}</p>
                            `;
                        } else {
                            resultDiv.innerHTML = '<p>分享失败: ' + fallbackResult.error + '</p>';
                        }
                    }
                });
            } catch (error) {
                resultDiv.innerHTML = '<p>错误: ' + error.message + '</p>';
            }
        }

        function testSaveImage() {
            const resultDiv = document.getElementById('result');
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 300;
                canvas.height = 200;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#f8f9fa';
                ctx.fillRect(0, 0, 300, 200);
                ctx.fillStyle = '#333';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('测试图片', 150, 100);
                
                canvas.toBlob((blob) => {
                    const success = shareFunctionalityModule.saveImage(blob);
                    resultDiv.innerHTML = '<p>图片保存: ' + (success ? '成功' : '失败') + '</p>';
                });
            } catch (error) {
                resultDiv.innerHTML = '<p>错误: ' + error.message + '</p>';
            }
        }

        async function testCopyLink() {
            const resultDiv = document.getElementById('result');
            try {
                const success = await shareFunctionalityModule.copyShareLink(testCardData.share_id);
                resultDiv.innerHTML = '<p>复制分享链接: ' + (success ? '成功' : '失败') + '</p>';
            } catch (error) {
                resultDiv.innerHTML = '<p>错误: ' + error.message + '</p>';
            }
        }

        async function testCopyText() {
            const resultDiv = document.getElementById('result');
            try {
                const success = await shareFunctionalityModule.copyText(testCardData.ai_poem);
                resultDiv.innerHTML = '<p>复制文案: ' + (success ? '成功' : '失败') + '</p>';
            } catch (error) {
                resultDiv.innerHTML = '<p>错误: ' + error.message + '</p>';
            }
        }

        async function testShareCapabilities() {
            const resultDiv = document.getElementById('result');
            try {
                const capabilities = await shareFunctionalityModule.testShareCapabilities();
                const methods = shareFunctionalityModule.getShareMethods();
                resultDiv.innerHTML = `
                    <p>系统分享支持: ${capabilities.systemShare}</p>
                    <p>剪贴板支持: ${capabilities.clipboard}</p>
                    <p>图片保存支持: ${capabilities.saveImage}</p>
                    <p>可用的分享方法: ${methods.join(', ')}</p>
                `;
            } catch (error) {
                resultDiv.innerHTML = '<p>错误: ' + error.message + '</p>';
            }
        }

        async function testShareRecords() {
            const resultDiv = document.getElementById('result');
            try {
                shareFunctionalityModule.recordShareAction(testCardData.id, 'test');
                const records = await shareFunctionalityModule.getShareRecords(testCardData.id);
                resultDiv.innerHTML = `
                    <p>分享记录数量: ${records.length}</p>
                    ${records.map(record => `
                        <p>ID: ${record.id}, 类型: ${record.action_type}, 时间: ${new Date(record.created_at).toLocaleString()}</p>
                    `).join('')}
                `;
            } catch (error) {
                resultDiv.innerHTML = '<p>错误: ' + error.message + '</p>';
            }
        }
    </script>
</body>
</html>
```

## 9. 注意事项

1. **环境限制**：系统分享、图片保存和剪贴板功能仅在浏览器环境中可用
2. **浏览器支持**：Web Share API在部分浏览器中可能不可用，会自动使用兜底方案
3. **安全上下文**：剪贴板API需要在安全上下文（HTTPS）中使用
4. **用户交互**：某些浏览器要求复制操作必须在用户交互事件中触发
5. **微信兼容**：在微信内置浏览器中，系统分享和剪贴板功能可能不可用，会使用兜底方案
6. **图片大小**：保存的图片会自动调整质量以确保体积≤300KB
7. **分享链接**：分享链接的有效性依赖于后端服务的支持
8. **性能优化**：分享操作可能需要一定时间，建议添加加载状态

## 10. 总结

分享功能模块提供了完整的卡片分享功能，支持系统分享、图片保存、链接复制和文案复制等多种分享方式。模块内置了完善的错误处理和兜底方案，确保在各种浏览器环境中都能正常工作。

该模块符合需求文档中的设计要求，为用户提供了便捷的分享功能，使心事可以以多种形式分享到社交平台，增强了应用的社交属性。