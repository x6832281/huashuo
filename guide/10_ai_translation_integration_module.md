# AI翻译集成模块 - 详细规格说明

## 1. 模块概述

### 1.1 模块名称
AI翻译集成模块（AI Translation Integration Module）

### 1.2 模块目标
集成OpenRouter API，实现AI翻译功能，将用户心事文本转换为情绪诗句。

### 1.3 模块定位
作为API服务模块的子模块，提供AI翻译能力。

## 2. 功能需求

### 2.1 核心功能
- **API调用**：调用OpenRouter API进行文本翻译
- **参数处理**：处理和验证输入参数
- **响应处理**：解析和处理API响应
- **错误处理**：处理API调用错误
- **内容过滤**：过滤生成内容中的敏感信息

### 2.2 业务规则
- **输入限制**：文本长度限制为1-1000字
- **输出要求**：
  - 诗句长度 ≤100字
  - 不包含人名、地点、手机号、具体事件细节
  - 生成三类表情包文案
- **内容安全**：
  - 不得包含辱骂脏话、人身攻击、地域/性别/种族歧视、诱导自伤、自杀相关细节
  - "损友式诋毁"仅允许"吐槽式打气"

## 3. 技术实现

### 3.1 技术栈
- **语言**：Python
- **HTTP客户端**：requests / aiohttp
- **环境管理**：环境变量
- **错误处理**：try-except

### 3.2 实现方案

#### 3.2.1 核心方法

##### 3.2.2.1 调用OpenRouter API
```python
# services/ai_service.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

def translate_text(text, style="heal_poem"):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    prompt = f"将以下文本翻译为{style}风格的诗句，长度不超过15字，不包含具体人名、地点、手机号等个人信息：\n{text}"
    
    data = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [
            {
                "role": "system",
                "content": "你是一个专业的诗歌翻译助手，擅长将普通文本转换为优美的诗句。"
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 100,
        "temperature": 0.7
    }
    
    try:
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        ai_poem = result["choices"][0]["message"]["content"].strip()
        
        # 生成表情包文案
        stickers = generate_stickers(ai_poem)
        
        # 分析情绪频段
        mood_band = analyze_mood(ai_poem)
        
        return {
            "mood_band": mood_band,
            "ai_poem": ai_poem,
            "stickers": stickers
        }
    except Exception as e:
        # 处理错误，使用本地模板
        return get_local_template(text)
```

##### 3.2.2.2 生成表情包文案
```python
def generate_stickers(poem):
    # 基于诗句生成三类表情包文案
    return {
        "comfort": "抱抱你 🫂",
        "gossip": "我先吃个瓜 🍉",
        "roast": "你又在内耗啦 🤺"
    }
```

##### 3.2.2.3 分析情绪频段
```python
def analyze_mood(poem):
    # 简单的情绪分析逻辑
    # 0: 低落/焦虑/疲惫
    # 1: 平静/波动/复杂
    # 2: 轻松/积极/被接住
    
    negative_words = ["难过", "伤心", "焦虑", "疲惫", "孤独", "痛苦"]
    positive_words = ["快乐", "开心", "轻松", "积极", "温暖", "希望"]
    
    negative_count = sum(1 for word in negative_words if word in poem)
    positive_count = sum(1 for word in positive_words if word in poem)
    
    if negative_count > positive_count:
        return 0
    elif positive_count > negative_count:
        return 2
    else:
        return 1
```

##### 3.2.2.4 本地模板降级
```python
def get_local_template(text):
    # 基于文本长度和简单分析返回本地模板
    return {
        "mood_band": 1,
        "ai_poem": "把心放回呼吸里",
        "stickers": {
            "comfort": "抱抱你 🫂",
            "gossip": "我先吃个瓜 🍉",
            "roast": "你又在内耗啦 🤺"
        }
    }
```

## 4. 测试方案

### 4.1 单元测试
- **测试场景**：
  - API调用成功
  - API调用失败降级
  - 表情包生成
  - 情绪分析
  - 错误处理

### 4.2 集成测试
- **测试场景**：
  - 与API服务模块集成
  - 与前端AI翻译模块集成

### 4.3 性能测试
- **测试场景**：
  - API调用响应时间
  - 不同长度文本的处理时间

## 5. 部署与兼容性

### 5.1 环境配置
- **Python版本**：3.8+
- **依赖**：requests、python-dotenv
- **环境变量**：OPENROUTER_API_KEY

### 5.2 安全配置
- **密钥管理**：通过环境变量存储API密钥
- **请求限制**：实现API调用限流

## 6. 风险与应对

### 6.1 风险
- **API调用失败**：网络问题或OpenRouter服务异常
- **API密钥泄露**：密钥被恶意获取
- **生成内容不符合要求**：AI生成的内容可能不符合规范
- **API费用**：频繁调用可能产生较高费用

### 6.2 应对措施
- **降级方案**：实现本地模板库，确保在API失败时仍能生成内容
- **密钥安全**：使用环境变量存储API密钥，避免硬编码
- **内容过滤**：对生成的内容进行基本过滤
- **调用限制**：实现API调用频率限制

## 7. 依赖关系

### 7.1 依赖模块
- 无

### 7.2 被依赖模块
- API服务模块

## 8. 开发计划

### 8.1 开发步骤
1. 配置OpenRouter API密钥
2. 实现API调用功能
3. 实现响应处理
4. 实现错误处理和降级方案
5. 实现表情包生成
6. 实现情绪分析
7. 编写测试用例
8. 集成测试

### 8.2 预期完成时间
- **估计时间**：1-2周
- **关键路径**：API调用和降级方案实现

## 9. 验收标准

### 9.1 功能验收
- API调用成功
- 降级方案有效
- 生成内容符合要求
- 情绪频段分析合理

### 9.2 性能验收
- API调用响应时间 < 2s
- 降级方案响应时间 < 500ms

### 9.3 安全验收
- API密钥管理安全
- 内容过滤有效
- 调用限制有效