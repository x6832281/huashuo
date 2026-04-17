# API服务模块使用说明

## 1. 模块介绍

API服务模块（API Service Module）是话说APP的后端核心模块，提供RESTful API接口，处理前端请求并与后端服务集成。

### 核心特性

- **AI翻译接口**：处理前端的AI翻译请求
- **分享创建接口**：处理分享卡片的创建请求
- **拥抱计数接口**：处理拥抱计数的增加请求
- **拥抱批量拉取接口**：处理批量拉取拥抱计数的请求
- **错误处理**：统一处理API错误
- **请求验证**：验证请求参数的合法性
- **响应格式化**：统一响应格式

## 2. 安装方法

### 2.1 环境要求

- **Python版本**：3.8+
- **依赖管理**：pip

### 2.2 安装步骤

1. **克隆项目**：
   ```bash
   git clone <repository-url>
   cd whisper/api
   ```

2. **创建虚拟环境**：
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. **安装依赖**：
   ```bash
   pip install -r requirements.txt
   ```

4. **配置环境变量**：
   创建 `.env` 文件：
   ```
   # .env
   OPENROUTER_API_KEY=<your-openrouter-api-key>
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_KEY=<your-supabase-key>
   ```

### 2.3 启动服务

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

服务将在 `http://localhost:8000` 启动。

## 3. API接口说明

### 3.1 AI翻译接口

**接口地址**：`POST /api/ai/translate`

**请求参数**：

| 参数 | 类型 | 必填 | 描述 | 默认值 |
|------|------|------|------|--------|
| `text` | string | 是 | 要翻译的文本 | - |
| `style` | string | 否 | 翻译风格 | "heal_poem" |

**响应格式**：

```json
{
  "mood_band": 1,
  "ai_poem": "月上柳梢人静时",
  "stickers": {
    "comfort": "一切都会好的 🌟",
    "gossip": "有点意思 👀",
    "roast": "淡定，小场面 🤣"
  }
}
```

**示例请求**：

```bash
curl -X POST http://localhost:8000/api/ai/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "今天心情很好！", "style": "heal_poem"}'
```

### 3.2 分享创建接口

**接口地址**：`POST /api/share/create`

**请求参数**：

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `ai_poem` | string | 是 | AI生成的诗句 |
| `mood_band` | number | 是 | 情绪类型（0-2） |

**响应格式**：

```json
{
  "share_id": "abc123def456",
  "share_url": "https://huashuo.app/s/abc123def456"
}
```

**示例请求**：

```bash
curl -X POST http://localhost:8000/api/share/create \
  -H "Content-Type: application/json" \
  -d '{"ai_poem": "月上柳梢人静时", "mood_band": 1}'
```

### 3.3 拥抱计数接口

**接口地址**：`POST /api/share/hug`

**请求参数**：

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `share_id` | string | 是 | 分享ID |
| `device_id` | string | 是 | 设备ID |

**响应格式**：

```json
{
  "hugs_count": 5
}
```

**示例请求**：

```bash
curl -X POST http://localhost:8000/api/share/hug \
  -H "Content-Type: application/json" \
  -d '{"share_id": "abc123def456", "device_id": "test-device-123"}'
```

### 3.4 拥抱批量拉取接口

**接口地址**：`POST /api/share/batch`

**请求参数**：

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `share_ids` | array | 是 | 分享ID列表 |

**响应格式**：

```json
{
  "items": [
    {
      "share_id": "abc123def456",
      "hugs_count": 5
    },
    {
      "share_id": "ghi789jkl012",
      "hugs_count": 3
    }
  ]
}
```

**示例请求**：

```bash
curl -X POST http://localhost:8000/api/share/batch \
  -H "Content-Type: application/json" \
  -d '{"share_ids": ["abc123def456", "ghi789jkl012"]}'
```

### 3.5 健康检查接口

**接口地址**：`GET /health`

**响应格式**：

```json
{
  "status": "healthy"
}
```

**示例请求**：

```bash
curl http://localhost:8000/health
```

## 4. 错误处理

### 4.1 错误响应格式

```json
{
  "error": "错误信息"
}
```

### 4.2 常见错误码

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 文本不能为空 | 请求参数验证失败 |
| 400 | 情绪类型必须是0、1或2 | 请求参数验证失败 |
| 500 | 内部服务器错误 | 服务器内部错误 |
| 500 | API调用失败 | 第三方API调用失败 |

## 5. 部署配置

### 5.1 云服务器部署

1. **安装依赖**：
   ```bash
   pip install -r requirements.txt
   ```

2. **配置环境变量**：
   - 在云服务器上设置环境变量或创建 `.env` 文件

3. **启动服务**：
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

4. **配置反向代理**：
   - 使用 Nginx 或 Apache 配置反向代理
   - 配置 HTTPS

### 5.2 Serverless部署

1. **使用 Vercel**：
   - 连接 GitHub 仓库
   - 配置环境变量
   - 部署项目

2. **使用 AWS Lambda**：
   - 创建 Lambda 函数
   - 配置 API Gateway
   - 部署函数

### 5.3 Docker部署

1. **创建 Dockerfile**：
   ```dockerfile
   FROM python:3.9-slim
   
   WORKDIR /app
   
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   
   COPY . .
   
   CMD uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **构建镜像**：
   ```bash
   docker build -t huashuo-api .
   ```

3. **运行容器**：
   ```bash
   docker run -p 8000:8000 --env-file .env huashuo-api
   ```

## 6. 安全配置

### 6.1 HTTPS配置

- 生产环境必须使用 HTTPS
- 配置 SSL 证书

### 6.2 CORS配置

- 生产环境应设置具体的允许域名，而非使用 `*`
- 示例配置：
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["https://huashuo.app"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

### 6.3 密钥管理

- 不要将 API 密钥硬编码在代码中
- 使用环境变量或密钥管理服务
- 定期轮换密钥

## 7. 性能优化

### 7.1 缓存策略

- 缓存 AI 翻译结果
- 缓存拥抱计数

### 7.2 限流措施

- 实现 API 限流
- 防止恶意请求

### 7.3 异步处理

- 使用异步函数处理请求
- 优化数据库查询

## 8. 监控与告警

### 8.1 日志记录

- 记录 API 请求日志
- 记录错误日志

### 8.2 监控指标

- API 响应时间
- 请求成功率
- 并发请求数

### 8.3 告警机制

- 配置错误告警
- 配置性能告警

## 9. 测试方法

### 9.1 运行测试

```bash
python test_api.py
```

### 9.2 手动测试

- 使用 Postman 或 curl 测试 API 接口
- 验证响应格式和状态码

### 9.3 负载测试

- 使用 ab 或 JMeter 进行负载测试
- 测试并发处理能力

## 10. 依赖关系

### 10.1 依赖服务

- **OpenRouter API**：用于 AI 翻译
- **Supabase**：用于数据存储

### 10.2 依赖库

| 库名 | 版本 | 用途 |
|------|------|------|
| fastapi | ^0.100.0 | Web 框架 |
| uvicorn | ^0.22.0 | ASGI 服务器 |
| pydantic | ^2.0.0 | 数据验证 |
| python-dotenv | ^1.0.0 | 环境变量管理 |
| aiohttp | ^3.8.0 | 异步 HTTP 客户端 |
| supabase | ^2.0.0 | Supabase 客户端 |

## 11. 常见问题与解决方案

### 11.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| API 调用失败 | OpenRouter API 密钥错误 | 检查 API 密钥配置 |
| 数据库连接失败 | Supabase 配置错误 | 检查 Supabase URL 和密钥 |
| 部署失败 | 依赖安装失败 | 确保 Python 版本正确，重新安装依赖 |
| 响应时间长 | 网络延迟或 API 限流 | 优化代码，添加缓存 |

### 11.2 解决方案

1. **API 调用失败**：
   - 检查 OpenRouter API 密钥是否正确
   - 检查网络连接
   - 查看 API 服务是否正常

2. **数据库连接失败**：
   - 检查 Supabase 项目配置
   - 检查网络连接
   - 查看 Supabase 服务状态

3. **部署失败**：
   - 检查 Python 版本
   - 重新安装依赖
   - 查看部署日志

4. **响应时间长**：
   - 添加缓存
   - 优化代码
   - 检查网络延迟

## 12. 总结

API服务模块是话说APP的后端核心，提供了完整的RESTful API接口，支持AI翻译、分享创建、拥抱计数等功能。模块采用FastAPI框架开发，具有高性能、易于扩展的特点。

通过合理的错误处理、请求验证和响应格式化，API服务模块提供了稳定可靠的接口服务。同时，模块支持多种部署方式，可根据实际需求选择合适的部署方案。

在生产环境中，建议配置HTTPS、合理设置CORS策略、安全管理密钥，并实现监控与告警机制，确保服务的安全性和可靠性。