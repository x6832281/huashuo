# AI翻译集成模块使用说明

## 1. 模块介绍

AI翻译集成模块（AI Translation Integration Module）是话说APP的AI能力核心模块，集成OpenRouter API，实现AI翻译功能，将用户心事文本转换为情绪诗句。

### 核心特性

- **API调用**：调用OpenRouter API进行文本翻译
- **参数处理**：处理和验证输入参数
- **响应处理**：解析和处理API响应
- **错误处理**：处理API调用错误
- **内容过滤**：过滤生成内容中的敏感信息
- **降级方案**：当API调用失败时使用本地模板

## 2. 安装方法

### 2.1 环境要求

- **Python版本**：3.8+
- **依赖**：
  - `requests` 或 `aiohttp`
  - `python-dotenv`

### 2.2 安装步骤

1. **安装依赖**：
   ```bash
   pip install requests python-dotenv
   # 或使用异步HTTP客户端
   pip install aiohttp python-dotenv
   ```

2. **配置环境变量**：
   创建 `.env` 文件：
   ```
   # .env
   OPENROUTER_API_KEY=<your-openrouter-api-key>
   ```

## 3. 核心功能使用

### 3.1 翻译文本

```python
from app.services.ai_service import translate_text

async def main():
    text = "今天心情很好！"
    result = await translate_text(text, style="heal_poem")
    print(result)

# 输出示例
# {
#     "mood_band": 2,
#     "ai_poem": "阳光正好风微醺",
#     "stickers": {
#         "comfort": "一切都会好的 🌟",
#         "gossip": "有点意思 👀",
#         "roast": "淡定，小场面 🤣"
#     }
# }
```

**参数说明**：
- `text`：要翻译的文本（1-1000字）
- `style`：翻译风格（默认为 "heal_poem"）

**返回值**：
- `mood_band`：情绪频段（0-2）
- `ai_poem`：AI生成的诗句
- `stickers`：三类表情包文案

### 3.2 生成表情包文案

```python
from app.services.ai_service import generate_stickers

poem = "月上柳梢人静时"
stickers = generate_stickers(poem)
print(stickers)

# 输出示例
# {
#     "comfort": "抱抱你 🫂",
#     "gossip": "我先吃个瓜 🍉",
#     "roast": "你又在内耗啦 🤺"
# }
```

**参数说明**：
- `poem`：AI生成的诗句

**返回值**：
- 包含三类表情包文案的字典

### 3.3 分析情绪频段

```python
from app.services.ai_service import analyze_mood

poem = "难过伤心孤独"
mood_band = analyze_mood(poem)
print(mood_band)  # 输出: 0

poem = "快乐开心轻松"
mood_band = analyze_mood(poem)
print(mood_band)  # 输出: 2

poem = "平静复杂"
mood_band = analyze_mood(poem)
print(mood_band)  # 输出: 1
```

**参数说明**：
- `poem`：AI生成的诗句

**返回值**：
- 情绪频段（0-2）
  - 0：低落/焦虑/疲惫
  - 1：平静/波动/复杂
  - 2：轻松/积极/被接住

### 3.4 本地模板降级

```python
from app.services.ai_service import get_local_template

text = "测试文本"
result = get_local_template(text)
print(result)

# 输出示例
# {
#     "mood_band": 1,
#     "ai_poem": "把心放回呼吸里",
#     "stickers": {
#         "comfort": "抱抱你 🫂",
#         "gossip": "我先吃个瓜 🍉",
#         "roast": "你又在内耗啦 🤺"
#     }
# }
```

**参数说明**：
- `text`：要翻译的文本

**返回值**：
- 本地模板生成的结果

## 4. 配置选项

### 4.1 环境变量

| 环境变量 | 说明 | 必需 |
|---------|------|------|
| `OPENROUTER_API_KEY` | OpenRouter API密钥 | 是 |

### 4.2 API配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `model` | 使用的AI模型 | "openai/gpt-4o" |
| `temperature` | 生成文本的随机性 | 0.7 |
| `max_tokens` | 最大生成 tokens | 100 |

## 5. 业务规则

### 5.1 输入限制

- **文本长度**：1-1000字
- **内容要求**：不包含敏感信息

### 5.2 输出要求

- **诗句长度**：≤15字
- **内容要求**：
  - 不包含人名、地点、手机号、具体事件细节
  - 不得包含辱骂脏话、人身攻击、地域/性别/种族歧视、诱导自伤、自杀相关细节
- **表情包文案**：
  - 安慰类：温暖鼓励的话语
  - 吃瓜类：中性客观的评价
  - 损友式诋毁：仅允许"吐槽式打气"

### 5.3 情绪频段定义

- **0**：低落/焦虑/疲惫
- **1**：平静/波动/复杂
- **2**：轻松/积极/被接住

## 6. 错误处理

### 6.1 常见错误

| 错误类型 | 原因 | 处理方式 |
|---------|------|----------|
| API调用失败 | 网络问题或OpenRouter服务异常 | 使用本地模板降级 |
| API密钥错误 | API密钥无效或过期 | 使用本地模板降级 |
| 输入文本过长 | 文本超过1000字 | 截断文本或使用本地模板 |

### 6.2 降级策略

当API调用失败时，模块会自动使用本地模板生成内容，确保服务不会中断。

## 7. 性能优化

### 7.1 缓存策略

- 缓存AI翻译结果，避免重复调用
- 缓存情绪分析结果

### 7.2 调用限制

- 实现API调用频率限制，避免过度调用
- 对同一文本的重复请求使用缓存

### 7.3 异步处理

- 使用异步HTTP客户端（aiohttp）提高并发处理能力
- 优化API调用超时设置

## 8. 安全配置

### 8.1 密钥管理

- 使用环境变量存储API密钥，避免硬编码
- 定期轮换API密钥

### 8.2 内容过滤

- 对输入和输出内容进行基本过滤
- 避免生成包含敏感信息的内容

### 8.3 调用限制

- 实现API调用频率限制
- 防止恶意请求导致API费用过高

## 9. 测试方法

### 9.1 运行测试

```bash
cd api
python test_ai_integration.py
```

### 9.2 测试场景

- **API调用成功**：验证API调用正常返回结果
- **API调用失败**：验证降级方案有效
- **表情包生成**：验证生成的表情包文案符合要求
- **情绪分析**：验证情绪频段分析合理
- **错误处理**：验证错误处理机制正常
- **输入验证**：验证输入参数验证有效

### 9.3 性能测试

- **API调用响应时间**：目标 < 2s
- **降级方案响应时间**：目标 < 500ms
- **不同长度文本的处理时间**：验证处理时间与文本长度的关系

## 10. 依赖关系

### 10.1 依赖服务

- **OpenRouter API**：用于AI翻译

### 10.2 依赖库

| 库名 | 版本 | 用途 |
|------|------|------|
| requests | ^2.31.0 | HTTP客户端 |
| aiohttp | ^3.8.0 | 异步HTTP客户端 |
| python-dotenv | ^1.0.0 | 环境变量管理 |

## 11. 常见问题与解决方案

### 11.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| API调用失败 | 网络问题或OpenRouter服务异常 | 检查网络连接，使用本地模板降级 |
| API密钥错误 | API密钥无效或过期 | 检查API密钥配置，使用本地模板降级 |
| 生成内容不符合要求 | AI生成的内容不符合规范 | 优化提示词，增加内容过滤 |
| API费用过高 | 频繁调用API | 实现缓存策略，限制调用频率 |

### 11.2 解决方案

1. **API调用失败**：
   - 检查网络连接
   - 检查OpenRouter服务状态
   - 确保API密钥正确
   - 实现本地模板降级

2. **API密钥错误**：
   - 检查API密钥配置
   - 确保API密钥未过期
   - 重新生成API密钥

3. **生成内容不符合要求**：
   - 优化提示词
   - 增加内容过滤
   - 调整模型参数

4. **API费用过高**：
   - 实现缓存策略
   - 限制调用频率
   - 使用更经济的模型

## 12. 总结

AI翻译集成模块是话说APP的AI能力核心，通过集成OpenRouter API，实现了将用户心事文本转换为情绪诗句的功能。模块具有完善的错误处理和降级方案，确保在API调用失败时仍能正常工作。

通过合理的参数处理、响应处理和内容过滤，模块确保生成的内容符合业务要求。同时，模块支持情绪分析和表情包文案生成，为用户提供了丰富的情感反馈。

在生产环境中，建议配置API密钥安全管理、实现缓存策略和调用限制，确保服务的稳定性和经济性。