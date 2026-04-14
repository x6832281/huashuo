# API服务模块 - 详细规格说明

## 1. 模块概述

### 1.1 模块名称
API服务模块（API Service Module）

### 1.2 模块目标
提供RESTful API接口，处理前端请求并与后端服务集成。

### 1.3 模块定位
作为应用的后端核心模块，连接前端与后端服务。

## 2. 功能需求

### 2.1 核心功能
- **AI翻译接口**：处理前端的AI翻译请求
- **分享创建接口**：处理分享卡片的创建请求
- **拥抱计数接口**：处理拥抱计数的增加请求
- **拥抱批量拉取接口**：处理批量拉取拥抱计数的请求
- **错误处理**：统一处理API错误
- **请求验证**：验证请求参数的合法性
- **响应格式化**：统一响应格式

### 2.2 业务规则
- **接口规范**：RESTful API规范
- **响应格式**：统一的JSON格式
- **错误处理**：明确的错误码和错误信息
- **安全措施**：避免暴露敏感信息
- **限流措施**：防止API滥用

## 3. 技术实现

### 3.1 技术栈
- **后端框架**：FastAPI / Flask
- **语言**：Python
- **部署**：云服务器 / Serverless
- **环境管理**：pip / virtualenv

### 3.2 实现方案

#### 3.2.1 项目结构
```
api/
├── app/
│   ├── __init__.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── ai.py
│   │   ├── share.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_service.py
│   │   ├── share_service.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── error_handler.py
│   │   ├── validator.py
├── main.py
├── requirements.txt
├── .env
```

#### 3.2.2 核心接口

##### 3.2.2.1 AI翻译接口
```python
# routes/ai.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import translate_text

router = APIRouter()

class TranslationRequest(BaseModel):
    text: str
    style: str = "heal_poem"

class TranslationResponse(BaseModel):
    mood_band: int
    ai_poem: str
    stickers: dict

@router.post("/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    try:
        result = await translate_text(request.text, request.style)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

##### 3.2.2.2 分享创建接口
```python
# routes/share.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.share_service import create_share

router = APIRouter()

class ShareCreateRequest(BaseModel):
    ai_poem: str
    mood_band: int

class ShareCreateResponse(BaseModel):
    share_id: str
    share_url: str

@router.post("/create", response_model=ShareCreateResponse)
async def create(request: ShareCreateRequest):
    try:
        result = await create_share(request.ai_poem, request.mood_band)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

##### 3.2.2.3 拥抱计数接口
```python
# routes/share.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.share_service import add_hug

class HugRequest(BaseModel):
    share_id: str
    device_id: str

class HugResponse(BaseModel):
    hugs_count: int

@router.post("/hug", response_model=HugResponse)
async def hug(request: HugRequest):
    try:
        result = await add_hug(request.share_id, request.device_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

##### 3.2.2.4 拥抱批量拉取接口
```python
# routes/share.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.share_service import batch_get_hugs

class BatchHugRequest(BaseModel):
    share_ids: list[str]

class HugItem(BaseModel):
    share_id: str
    hugs_count: int

class BatchHugResponse(BaseModel):
    items: list[HugItem]

@router.post("/batch", response_model=BatchHugResponse)
async def batch(request: BatchHugRequest):
    try:
        result = await batch_get_hugs(request.share_ids)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### 3.2.3 主应用入口
```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import ai, share

app = FastAPI()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应设置具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(share.router, prefix="/api/share", tags=["share"])

@app.get("/")
async def root():
    return {"message": "Huashuo API Service"}
```

## 4. 测试方案

### 4.1 单元测试
- **测试场景**：
  - API接口响应
  - 请求参数验证
  - 错误处理
  - 响应格式化

### 4.2 集成测试
- **测试场景**：
  - 与AI翻译服务集成
  - 与Supabase集成
  - 与防刷限流模块集成

### 4.3 性能测试
- **测试场景**：
  - API响应时间
  - 并发处理能力
  - 限流措施效果

## 5. 部署与兼容性

### 5.1 部署方式
- **云服务器**：EC2、DigitalOcean等
- **Serverless**：AWS Lambda、Vercel等
- **容器化**：Docker + Kubernetes

### 5.2 环境配置
- **Python版本**：3.8+
- **依赖管理**：pip + requirements.txt
- **环境变量**：.env文件或云服务环境变量

### 5.3 安全配置
- **HTTPS**：必须使用HTTPS
- **CORS**：合理配置CORS策略
- **密钥管理**：安全存储API密钥

## 6. 风险与应对

### 6.1 风险
- **服务不稳定**：后端服务可能出现故障
- **API滥用**：恶意请求可能导致服务过载
- **安全漏洞**：API可能存在安全漏洞
- **依赖问题**：第三方服务可能不可用

### 6.2 应对措施
- **监控告警**：实现服务监控和告警机制
- **限流措施**：实现API限流和防刷
- **安全审计**：定期进行安全审计
- **降级方案**：实现服务降级机制

## 7. 依赖关系

### 7.1 依赖模块
- AI翻译集成模块
- Supabase集成模块
- 防刷限流模块

### 7.2 被依赖模块
- 前端所有需要API的模块

## 8. 开发计划

### 8.1 开发步骤
1. 搭建项目结构
2. 实现基础路由
3. 实现API接口
4. 实现错误处理
5. 实现请求验证
6. 编写测试用例
7. 集成测试
8. 部署配置

### 8.2 预期完成时间
- **估计时间**：2-3周
- **关键路径**：API接口实现和集成测试

## 9. 验收标准

### 9.1 功能验收
- API接口响应正常
- 请求参数验证正确
- 错误处理合理
- 响应格式统一

### 9.2 性能验收
- API响应时间 < 1s
- 并发处理能力 ≥ 100 QPS
- 限流措施有效

### 9.3 安全验收
- HTTPS配置正确
- CORS策略合理
- 密钥管理安全
- 无明显安全漏洞