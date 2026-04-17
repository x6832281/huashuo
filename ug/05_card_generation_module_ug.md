# 卡片生成模块使用说明

## 1. 模块介绍

卡片生成模块（Card Generation Module）是话说APP的分享核心模块，生成包含AI诗句和二维码的分享卡片，支持导出和分享功能。

### 核心特性

- **卡片生成**：使用Canvas绘制包含AI诗句和二维码的卡片
- **二维码生成**：生成包含share_id的二维码
- **表情包选择**：从三类表情包文案中选择一个叠加到卡片
- **卡片导出**：导出为PNG图片
- **卡片分享**：使用系统分享API分享卡片
- **分享链接生成**：生成包含share_id的分享链接
- **拥抱功能**：记录和增加卡片的拥抱数

## 2. 安装方法

### 2.1 引入模块

在 Node.js 环境中：

```javascript
const cardGenerationModule = require('./src/card/cardGeneration');
```

在浏览器环境中：

```html
<script src="path/to/cardGeneration.js"></script>
```

### 2.2 依赖模块

卡片生成模块依赖于以下模块：

```javascript
const localStorageModule = require('../storage/localStorage');
const aiTranslationModule = require('../ai/aiTranslation');
```

## 3. 核心功能使用

### 3.1 创建卡片

```javascript
const aiResult = await aiTranslationModule.translateText('今天心情很好！');
const card = await cardGenerationModule.createCard('post-id-123', aiResult);
console.log('卡片创建成功:', card);
```

**参数说明**：
- `postId`：心事ID
- `aiResult`：AI翻译结果，包含诗句和表情包文案

**返回**：创建的卡片对象

### 3.2 获取卡片

```javascript
const card = await cardGenerationModule.getCard(cardId);
console.log('卡片信息:', card);
```

**参数说明**：
- `cardId`：卡片ID

**返回**：卡片对象

### 3.3 更新卡片

```javascript
const updatedCard = await cardGenerationModule.updateCard(cardId, {
  sticker_selected_type: 'gossip'
});
console.log('卡片更新成功:', updatedCard);
```

**参数说明**：
- `cardId`：卡片ID
- `updates`：要更新的属性

**返回**：更新后的卡片对象

### 3.4 生成卡片（Canvas）

```javascript
const canvas = cardGenerationModule.generateCard(card);
document.body.appendChild(canvas);
```

**参数说明**：
- `card`：卡片对象

**返回**：Canvas元素

### 3.5 导出卡片

```javascript
const canvas = cardGenerationModule.generateCard(card);
const blob = cardGenerationModule.exportCard(canvas);

// 下载卡片
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'card.png';
a.click();
```

**参数说明**：
- `canvas`：Canvas元素

**返回**：PNG图片的Blob对象

### 3.6 分享卡片

```javascript
const canvas = cardGenerationModule.generateCard(card);
const blob = cardGenerationModule.exportCard(canvas);
const shared = await cardGenerationModule.shareCard(card, blob);

if (!shared) {
  // Web Share API不可用，使用兜底方案
  const shareLink = cardGenerationModule.generateShareLink(card.share_id);
  console.log('分享链接:', shareLink);
}
```

**参数说明**：
- `card`：卡片对象
- `imageBlob`：卡片图片的Blob对象

**返回**：布尔值，表示是否成功使用系统分享

### 3.7 生成分享链接

```javascript
const shareLink = cardGenerationModule.generateShareLink(card.share_id);
console.log('分享链接:', shareLink);
```

**参数说明**：
- `shareId`：卡片的分享ID

**返回**：分享链接字符串

### 3.8 增加拥抱数

```javascript
const huggedCard = await cardGenerationModule.incrementHug(cardId);
console.log('拥抱数增加成功，当前拥抱数:', huggedCard.hugs_count);
```

**参数说明**：
- `cardId`：卡片ID

**返回**：更新后的卡片对象

### 3.9 通过心事ID获取卡片

```javascript
const card = await cardGenerationModule.getCardByPostId(postId);
console.log('通过心事ID获取卡片:', card);
```

**参数说明**：
- `postId`：心事ID

**返回**：卡片对象

### 3.10 删除卡片

```javascript
const deletedCard = await cardGenerationModule.deleteCard(cardId);
console.log('卡片删除成功:', deletedCard);
```

**参数说明**：
- `cardId`：卡片ID

**返回**：删除后的卡片对象

## 4. 数据结构

### 4.1 卡片对象

```javascript
interface Card {
  id: string;                // 唯一标识符
  post_id: string;           // 所属心事ID
  share_id?: string;         // 分享ID（可选）
  ai_poem: string;           // AI生成的诗句
  sticker_comfort: string;   // 安慰表情包文案
  sticker_gossip: string;    // 吃瓜表情包文案
  sticker_roast: string;     // 损友式诋毁表情包文案
  sticker_selected_type?: string; // 选中的表情包类型（可选）
  hugs_count: number;        // 拥抱数
  created_at: number;        // 创建时间戳
  exported_at?: number;      // 导出时间戳（可选）
  synced_at?: number;        // 同步时间戳（可选）
  deleted_at?: number;       // 删除时间戳（可选）
}
```

### 4.2 卡片示例

```javascript
{
  id: "mo2swwk4p0n5ny2n1s",
  post_id: "test-post-id",
  share_id: "mo2swwk4l5gj848qytj",
  ai_poem: "月上柳梢人静时",
  sticker_comfort: "一切都会好的 🌟",
  sticker_gossip: "有点意思 👀",
  sticker_roast: "淡定，小场面 🤣",
  sticker_selected_type: "gossip",
  hugs_count: 1,
  created_at: 1776423882965,
  exported_at: null,
  synced_at: null,
  deleted_at: null
}
```

## 5. 业务规则

### 5.1 卡片布局

- **尺寸**：600x800像素
- **背景**：渐变色背景
- **字体**：Arial, sans-serif
- **留白**：统一的边距和间距
- **布局**：诗句居中，表情包文案在下方，二维码在底部

### 5.2 二维码规范

- **内容**：包含share_id的分享链接
- **尺寸**：120x120像素
- **位置**：卡片底部中央
- **扫码**：支持微信/小红书扫码

### 5.3 表情包选择

- **默认**：默认选中"安慰"类型
- **类型**：安慰、吃瓜、损友式诋毁
- **显示**：叠加在卡片下方

### 5.4 导出限制

- **格式**：PNG格式
- **体积**：≤300KB
- **质量**：自动调整质量以满足体积限制
- **EXIF**：不携带EXIF信息

### 5.5 分享规则

- **优先**：使用Web Share API进行系统分享
- **兜底**：不支持系统分享时提供分享链接
- **内容**：分享标题、诗句文本和分享链接

## 6. 错误处理

模块内置了完善的错误处理机制：

```javascript
try {
  const card = await cardGenerationModule.createCard('post-id-123', aiResult);
  console.log('卡片创建成功:', card);
} catch (error) {
  console.error('创建卡片失败:', error.message);
}
```

### 6.1 常见错误

| 错误信息 | 说明 |
|---------|------|
| 心事ID无效 | 心事ID为空或格式错误 |
| AI结果无效 | AI结果缺少必要字段 |
| 卡片不存在 | 指定的卡片ID不存在 |
| 卡片生成失败 | Canvas绘制失败 |
| 卡片导出失败 | 图片导出失败 |

## 7. 浏览器兼容性

| 浏览器 | 版本要求 | 支持状态 |
|--------|---------|----------|
| Chrome | 60+ | ✅ 完全支持 |
| Firefox | 55+ | ✅ 完全支持 |
| Safari | 12+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |
| 微信内置浏览器 | - | ✅ 支持（使用兜底方案） |

## 8. 完整示例

### 8.1 浏览器环境示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>卡片生成示例</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .result { margin: 20px 0; padding: 10px; border: 1px solid #ddd; }
        canvas { border: 1px solid #ddd; margin: 10px 0; }
        img { border: 1px solid #ddd; margin: 10px 0; max-width: 300px; }
    </style>
</head>
<body>
    <h1>卡片生成示例</h1>
    
    <button onclick="createCard()">创建卡片</button>
    <button onclick="generateCard()">生成卡片</button>
    <button onclick="exportCard()">导出卡片</button>
    <button onclick="shareCard()">分享卡片</button>
    <button onclick="incrementHug()">增加拥抱数</button>
    
    <div id="result" class="result"></div>
    <div id="card-container"></div>
    <div id="export-container"></div>

    <script src="src/storage/localStorage.js"></script>
    <script src="src/ai/aiTranslation.js"></script>
    <script src="src/card/cardGeneration.js"></script>
    <script>
        let testCard = null;

        async function createCard() {
            const resultDiv = document.getElementById('result');
            try {
                const aiResult = await aiTranslationModule.translateText('今天心情很好！');
                testCard = await cardGenerationModule.createCard('test-post-id', aiResult);
                resultDiv.innerHTML = `
                    <h3>卡片创建成功</h3>
                    <p>ID: ${testCard.id}</p>
                    <p>分享ID: ${testCard.share_id}</p>
                    <p>诗句: ${testCard.ai_poem}</p>
                    <p>拥抱数: ${testCard.hugs_count}</p>
                `;
            } catch (error) {
                resultDiv.innerHTML = `<h3>错误</h3><p>${error.message}</p>`;
            }
        }

        function generateCard() {
            const container = document.getElementById('card-container');
            try {
                if (!testCard) {
                    throw new Error('请先创建卡片');
                }
                const canvas = cardGenerationModule.generateCard(testCard);
                container.innerHTML = '';
                container.appendChild(canvas);
            } catch (error) {
                container.innerHTML = `<p>错误: ${error.message}</p>`;
            }
        }

        function exportCard() {
            const container = document.getElementById('export-container');
            try {
                if (!testCard) {
                    throw new Error('请先创建卡片');
                }
                const canvas = cardGenerationModule.generateCard(testCard);
                const blob = cardGenerationModule.exportCard(canvas);
                const url = URL.createObjectURL(blob);
                const img = document.createElement('img');
                img.src = url;
                container.innerHTML = '';
                container.appendChild(img);
                
                // 下载链接
                const a = document.createElement('a');
                a.href = url;
                a.download = 'card.png';
                a.textContent = '下载卡片';
                container.appendChild(a);
            } catch (error) {
                container.innerHTML = `<p>错误: ${error.message}</p>`;
            }
        }

        async function shareCard() {
            const resultDiv = document.getElementById('result');
            try {
                if (!testCard) {
                    throw new Error('请先创建卡片');
                }
                const canvas = cardGenerationModule.generateCard(testCard);
                const blob = cardGenerationModule.exportCard(canvas);
                const shared = await cardGenerationModule.shareCard(testCard, blob);
                if (shared) {
                    resultDiv.innerHTML += '<p>分享成功</p>';
                } else {
                    const shareLink = cardGenerationModule.generateShareLink(testCard.share_id);
                    resultDiv.innerHTML += `<p>Web Share API不可用，分享链接: <a href="${shareLink}" target="_blank">${shareLink}</a></p>`;
                }
            } catch (error) {
                resultDiv.innerHTML += `<p>分享失败: ${error.message}</p>`;
            }
        }

        async function incrementHug() {
            const resultDiv = document.getElementById('result');
            try {
                if (!testCard) {
                    throw new Error('请先创建卡片');
                }
                const huggedCard = await cardGenerationModule.incrementHug(testCard.id);
                testCard = huggedCard;
                resultDiv.innerHTML += `<p>拥抱数增加成功，当前拥抱数: ${huggedCard.hugs_count}</p>`;
            } catch (error) {
                resultDiv.innerHTML += `<p>增加拥抱数失败: ${error.message}</p>`;
            }
        }
    </script>
</body>
</html>
```

## 9. 注意事项

1. **Canvas依赖**：卡片生成功能依赖于浏览器的Canvas API，在非浏览器环境中无法使用
2. **分享限制**：Web Share API在某些浏览器或环境中可能不可用，会自动使用兜底方案
3. **图片大小**：导出的图片会自动调整质量以确保体积≤300KB
4. **二维码**：二维码包含分享链接，用于扫码查看详情
5. **离线处理**：网络不可用时，分享功能会使用本地生成的分享链接
6. **性能优化**：卡片生成和导出操作可能需要一定时间，建议添加加载状态
7. **微信兼容**：在微信内置浏览器中，分享功能会使用兜底方案

## 10. 总结

卡片生成模块提供了完整的卡片创建、生成、导出和分享功能，通过Canvas API绘制美观的分享卡片，包含AI诗句、表情包文案和二维码。模块支持系统分享和兜底方案，确保在各种环境下都能正常工作。

该模块符合需求文档中的设计要求，为用户提供了便捷的分享功能，使心事可以以美观的卡片形式分享到社交平台。