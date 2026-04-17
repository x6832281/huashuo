# AI翻译模块使用说明

## 1. 模块介绍

AI翻译模块（AI Translation Module）是话说APP的核心AI能力模块，将用户心事文本翻译为可公开分享的社交货币文案，避免暴露隐私与具体细节。

### 核心特性

- **情绪分析**：分析用户心事的情绪倾向，确定情绪频段
- **文案生成**：将心事翻译为简洁的诗句
- **表情包生成**：生成三类表情包文案（安慰、吃瓜、损友式诋毁）
- **降级处理**：AI失败时使用本地模板库替代
- **批处理**：支持批量处理多条文本

## 2. 安装方法

### 2.1 引入模块

在 Node.js 环境中：

```javascript
const aiTranslationModule = require('./src/ai/aiTranslation');
```

在浏览器环境中：

```html
<script src="path/to/aiTranslation.js"></script>
```

### 2.2 配置API密钥

AI翻译模块支持使用OpenRouter API进行AI生成，如果需要使用AI能力，请设置环境变量：

```bash
# Windows
set OPENROUTER_API_KEY=your_api_key_here

# Linux/Mac
export OPENROUTER_API_KEY=your_api_key_here
```

如果未设置API密钥，模块会自动使用本地模板库。

## 3. 核心功能使用

### 3.1 翻译文本

```javascript
const result = await aiTranslationModule.translateText('今天心情很好，天气也不错！');
console.log('翻译结果:', result);
```

**参数说明**：
- `text`：用户心事文本
- `style`：风格（默认：'heal_poem'）

**返回**：
```javascript
{
  mood_band: 2, // 情绪频段（0-2）
  ai_poem: '阳光明媚心花开', // AI生成的诗句
  stickers: {
    comfort: '太棒了！🎉', // 安慰表情包文案
    gossip: '羡慕了羡慕了 😍', // 吃瓜表情包文案
    roast: '可以啊你 👍' // 损友式诋毁表情包文案
  }
}
```

### 3.2 批量翻译

```javascript
const texts = [
  '今天心情很好！',
  '今天心情很差',
  '今天和平常一样'
];

const results = await aiTranslationModule.batchTranslate(texts);
console.log('批量翻译结果:', results);
```

**参数说明**：
- `texts`：文本数组
- `style`：风格（默认：'heal_poem'）

**返回**：
```javascript
[
  {
    text: '今天心情很好！',
    result: { /* 翻译结果 */ },
    success: true
  },
  // 其他文本的结果...
]
```

### 3.3 情绪分析

```javascript
const mood = aiTranslationModule.analyzeMood('今天心情很好，天气也不错！');
console.log('情绪分析结果:', mood); // 0-2
```

**参数说明**：
- `text`：要分析的文本

**返回**：情绪频段（0-2）
- 0：低落/焦虑/疲惫
- 1：平静/波动/复杂
- 2：轻松/积极/被接住

### 3.4 获取本地模板

```javascript
const template = aiTranslationModule.getLocalTemplate('今天心情很好！');
console.log('本地模板:', template);
```

**参数说明**：
- `text`：用于情绪分析的文本

**返回**：与 `translateText` 相同格式的结果

### 3.5 验证响应

```javascript
const isValid = aiTranslationModule.validateResponse(response);
console.log('响应是否有效:', isValid);
```

**参数说明**：
- `response`：要验证的响应对象

**返回**：布尔值，表示响应是否有效

## 4. 数据结构

### 4.1 响应数据结构

```javascript
interface TranslationResponse {
  mood_band: number;   // 情绪频段（0-2）
  ai_poem: string;     // AI生成的诗句
  stickers: {
    comfort: string;   // 安慰表情包文案
    gossip: string;    // 吃瓜表情包文案
    roast: string;     // 损友式诋毁表情包文案
  };
}
```

### 4.2 情绪频段

| 频段值 | 标签 | 含义 |
|-------|------|------|
| 0 | 🌧️ 低落/焦虑/疲惫 | 负面情绪 |
| 1 | 🌤️ 平静/波动/复杂 | 中性情绪 |
| 2 | ☀️ 轻松/积极/被接住 | 正面情绪 |

### 4.3 批量翻译结果结构

```javascript
interface BatchResult {
  text: string;       // 原始文本
  result?: object;    // 翻译结果（成功时）
  error?: string;     // 错误信息（失败时）
  success: boolean;   // 是否成功
}
```

## 5. 业务规则

### 5.1 输入限制

- **文本**：支持任意长度的文本
- **风格**：目前仅支持 'heal_poem' 风格

### 5.2 输出限制

- **诗句**：长度 ≤15字，不含标点
- **表情包文案**：每条 ≤10字，附1个Emoji
- **内容**：不包含人名、地点、手机号、具体事件细节

### 5.3 表情包类型

- **安慰类**：温暖、鼓励的话语
- **吃瓜类**：中立、好奇的表达
- **损友式诋毁类**：吐槽式打气，不攻击人格

### 5.4 内容安全

- 不得包含辱骂脏话、人身攻击、地域/性别/种族歧视、诱导自伤、自杀相关细节
- 所有内容均在本地处理，不上传用户原始文本

## 6. 错误处理

模块内置了完善的错误处理机制：

```javascript
try {
  const result = await aiTranslationModule.translateText('今天心情很好！');
  console.log('翻译成功:', result);
} catch (error) {
  console.error('翻译失败:', error.message);
}
```

### 6.1 降级机制

当API调用失败时，模块会自动降级使用本地模板库：

1. **API调用失败**：网络问题或后端服务异常
2. **自动降级**：使用本地模板库生成内容
3. **返回结果**：与API调用相同格式的结果

### 6.2 常见错误

| 错误信息 | 说明 | 处理方式 |
|---------|------|----------|
| API key not set, using local template | 未设置API密钥 | 使用本地模板 |
| API request failed: 401 | API密钥无效 | 使用本地模板 |
| API request failed: 429 | API调用频率过高 | 使用本地模板 |
| API request failed: 500 | 服务器错误 | 使用本地模板 |

## 7. 浏览器兼容性

| 浏览器 | 版本要求 | 支持状态 |
|--------|---------|----------|
| Chrome | 60+ | ✅ 完全支持 |
| Firefox | 55+ | ✅ 完全支持 |
| Safari | 12+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |

## 8. 网络兼容性

- **在线状态**：优先使用API生成内容
- **离线状态**：自动使用本地模板库
- **弱网络**：增加超时处理，自动降级

## 9. 完整示例

### 9.1 Node.js 环境示例

```javascript
const aiTranslationModule = require('./src/ai/aiTranslation');

async function runExample() {
    try {
        // 1. 翻译单条文本
        console.log('1. 翻译单条文本...');
        const result1 = await aiTranslationModule.translateText('今天心情很好，天气也不错！');
        console.log('✅ 翻译成功:');
        console.log('   情绪频段:', result1.mood_band);
        console.log('   诗句:', result1.ai_poem);
        console.log('   安慰文案:', result1.stickers.comfort);
        console.log('   吃瓜文案:', result1.stickers.gossip);
        console.log('   损友文案:', result1.stickers.roast);

        // 2. 批量翻译
        console.log('\n2. 批量翻译...');
        const texts = [
            '今天心情很好！',
            '今天心情很差',
            '今天和平常一样'
        ];
        const batchResults = await aiTranslationModule.batchTranslate(texts);
        console.log('✅ 批量翻译成功，共处理', batchResults.length, '条文本');
        batchResults.forEach((item, index) => {
            if (item.success) {
                console.log(`   ${index + 1}. 成功: ${item.text}`);
                console.log(`      情绪频段: ${item.result.mood_band}`);
                console.log(`      诗句: ${item.result.ai_poem}`);
            } else {
                console.log(`   ${index + 1}. 失败: ${item.text}`);
                console.log(`      错误: ${item.error}`);
            }
        });

        // 3. 情绪分析
        console.log('\n3. 情绪分析...');
        const mood1 = aiTranslationModule.analyzeMood('今天心情很好！');
        const mood2 = aiTranslationModule.analyzeMood('今天心情很差');
        console.log('✅ 积极情绪分析结果:', mood1);
        console.log('✅ 消极情绪分析结果:', mood2);

    } catch (error) {
        console.error('❌ 发生错误:', error.message);
    }
}

runExample();
```

### 9.2 浏览器环境示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI翻译模块示例</title>
</head>
<body>
    <h1>AI翻译模块示例</h1>
    <div id="result"></div>

    <script src="src/ai/aiTranslation.js"></script>
    <script>
        async function runExample() {
            const resultDiv = document.getElementById('result');

            try {
                // 1. 翻译文本
                resultDiv.innerHTML += '<p>1. 翻译文本...</p>';
                const result = await aiTranslationModule.translateText('今天心情很好，天气也不错！');
                resultDiv.innerHTML += '<p>✅ 翻译成功:</p>';
                resultDiv.innerHTML += `<p>   情绪频段: ${result.mood_band}</p>`;
                resultDiv.innerHTML += `<p>   诗句: ${result.ai_poem}</p>`;
                resultDiv.innerHTML += `<p>   安慰文案: ${result.stickers.comfort}</p>`;
                resultDiv.innerHTML += `<p>   吃瓜文案: ${result.stickers.gossip}</p>`;
                resultDiv.innerHTML += `<p>   损友文案: ${result.stickers.roast}</p>`;

                // 2. 情绪分析
                resultDiv.innerHTML += '<p>2. 情绪分析...</p>';
                const mood = aiTranslationModule.analyzeMood('今天心情很好！');
                resultDiv.innerHTML += `<p>✅ 情绪分析结果: ${mood}</p>`;

            } catch (error) {
                resultDiv.innerHTML += `<p>❌ 发生错误: ${error.message}</p>`;
            }
        }

        runExample();
    </script>
</body>
</html>
```

## 10. 注意事项

1. **API密钥**：设置API密钥可获得更好的AI生成效果，未设置时使用本地模板
2. **内容安全**：所有用户原始文本均在本地处理，不上传服务器
3. **降级机制**：网络问题时会自动使用本地模板，确保功能正常
4. **输出限制**：生成的内容严格遵守长度限制和内容安全规则
5. **性能优化**：API调用可能需要2-3秒响应时间，建议添加加载状态
6. **批量处理**：批量翻译时会按顺序处理，数量较多时可能需要较长时间
7. **本地模板**：本地模板库提供基础的文案生成，适合离线使用

## 11. 总结

AI翻译模块提供了强大的文本分析和文案生成能力，通过AI技术将用户心事转化为适合分享的社交货币文案。模块支持情绪分析、诗句生成、表情包文案生成等功能，并实现了完善的降级机制，确保在各种网络环境下都能正常工作。

该模块符合需求文档中的设计要求，为情绪树洞和卡片生成模块提供了核心AI能力支持。