# 防刷限流模块 - 详细规格说明

## 1. 模块概述

### 1.1 模块名称
防刷限流模块（Anti-brush Rate Limit Module）

### 1.2 模块目标
防止恶意刷取API和重复点击拥抱按钮，保护系统安全和资源。

### 1.3 模块定位
作为API服务模块的子模块，提供安全保障。

## 2. 功能需求

### 2.1 核心功能
- **IP限流**：限制同一IP的请求频率
- **设备限流**：限制同一设备的请求频率
- **路径限流**：针对不同API路径设置不同的限流规则
- **拥抱防刷**：防止同一设备对同一分享卡片重复点击拥抱
- **异常检测**：检测并阻止异常请求模式

### 2.2 业务规则
- **IP限流**：同IP对同一API每分钟最多3次
- **设备限流**：同设备对同一分享卡片每日最多1次拥抱
- **路径限流**：
  - `/api/ai/translate`：每分钟最多5次
  - `/api/share/create`：每分钟最多10次
  - `/api/share/hug`：每分钟最多3次
  - `/api/share/batch`：每分钟最多5次
- **响应处理**：超过限制时返回429状态码

## 3. 技术实现

### 3.1 技术栈
- **语言**：Python
- **缓存**：Redis / 内存缓存
- **时间处理**：datetime
- **错误处理**：try-except

### 3.2 实现方案

#### 3.2.1 核心方法

##### 3.2.2.1 IP限流
```python
# utils/rate_limiter.py
import time
from collections import defaultdict

class RateLimiter:
    def __init__(self):
        self.ip_requests = defaultdict(list)  # {ip: [timestamps]}
        self.device_requests = defaultdict(list)  # {device_id: [timestamps]}
        self.hug_requests = defaultdict(set)  # {device_id: {share_id}}
    
    def is_ip_allowed(self, ip, limit=3, window=60):
        """检查IP是否允许请求"""
        current_time = time.time()
        timestamps = self.ip_requests[ip]
        
        # 清理过期的时间戳
        timestamps = [ts for ts in timestamps if current_time - ts < window]
        self.ip_requests[ip] = timestamps
        
        # 检查是否超过限制
        if len(timestamps) >= limit:
            return False
        
        # 记录新请求
        timestamps.append(current_time)
        return True
    
    def is_device_allowed(self, device_id, share_id=None, limit=1, window=86400):
        """检查设备是否允许请求"""
        current_time = time.time()
        
        if share_id:
            # 检查拥抱防刷
            key = f"{device_id}:{share_id}"
            if key in self.hug_requests:
                # 检查是否在24小时内
                last_hug_time = self.hug_requests[key]
                if current_time - last_hug_time < window:
                    return False
                else:
                    # 更新时间戳
                    self.hug_requests[key] = current_time
                    return True
            else:
                # 首次拥抱
                self.hug_requests[key] = current_time
                return True
        else:
            # 设备限流
            timestamps = self.device_requests[device_id]
            
            # 清理过期的时间戳
            timestamps = [ts for ts in timestamps if current_time - ts < window]
            self.device_requests[device_id] = timestamps
            
            # 检查是否超过限制
            if len(timestamps) >= limit:
                return False
            
            # 记录新请求
            timestamps.append(current_time)
            return True
    
    def is_path_allowed(self, ip, path, limits):
        """检查路径是否允许请求"""
        # 根据路径获取限制
        limit = limits.get(path, 3)
        window = 60  # 默认1分钟
        
        return self.is_ip_allowed(ip, limit, window)
```

##### 3.2.2.2 限流中间件
```python
# utils/middleware.py
from fastapi import HTTPException, Request
from .rate_limiter import RateLimiter

rate_limiter = RateLimiter()

# 路径限流规则
PATH_LIMITS = {
    "/api/ai/translate": 5,
    "/api/share/create": 10,
    "/api/share/hug": 3,
    "/api/share/batch": 5
}

async def rate_limit_middleware(request: Request, call_next):
    """限流中间件"""
    ip = request.client.host
    path = request.url.path
    
    # 检查路径限流
    if not rate_limiter.is_path_allowed(ip, path, PATH_LIMITS):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")
    
    response = await call_next(request)
    return response
```

##### 3.2.2.3 拥抱防刷验证
```python
# services/share_service.py
from utils.rate_limiter import rate_limiter

def add_hug(share_id, device_id):
    # 检查设备是否允许拥抱
    if not rate_limiter.is_device_allowed(device_id, share_id):
        raise Exception("您今天已经给这个卡片送过拥抱了")
    
    # 后续逻辑...
```

## 4. 测试方案

### 4.1 单元测试
- **测试场景**：
  - IP限流功能
  - 设备限流功能
  - 路径限流功能
  - 拥抱防刷功能
  - 异常检测功能

### 4.2 集成测试
- **测试场景**：
  - 与API服务模块集成
  - 与Supabase集成模块集成

### 4.3 性能测试
- **测试场景**：
  - 限流处理性能
  - 并发请求处理

## 5. 部署与兼容性

### 5.1 环境配置
- **Python版本**：3.8+
- **依赖**：无特殊依赖
- **缓存**：生产环境建议使用Redis

### 5.2 安全配置
- **日志记录**：记录异常请求但不记录敏感信息
- **监控**：监控限流触发情况

## 6. 风险与应对

### 6.1 风险
- **缓存溢出**：内存缓存可能溢出
- **误判**：正常用户可能被误判为刷取
- **性能影响**：限流检查可能影响API响应速度

### 6.2 应对措施
- **缓存管理**：定期清理过期数据，生产环境使用Redis
- **合理阈值**：设置合理的限流阈值，避免误判
- **异步处理**：考虑使用异步方式处理限流检查

## 7. 依赖关系

### 7.1 依赖模块
- 无

### 7.2 被依赖模块
- API服务模块

## 8. 开发计划

### 8.1 开发步骤
1. 实现基础限流逻辑
2. 实现IP限流
3. 实现设备限流
4. 实现路径限流
5. 实现拥抱防刷
6. 集成到API服务
7. 编写测试用例
8. 集成测试

### 8.2 预期完成时间
- **估计时间**：1周
- **关键路径**：限流逻辑实现和API集成

## 9. 验收标准

### 9.1 功能验收
- IP限流功能正常
- 设备限流功能正常
- 路径限流功能正常
- 拥抱防刷功能正常
- 超过限制时返回429状态码

### 9.2 性能验收
- 限流检查响应时间 < 10ms
- 并发处理能力 ≥ 1000 QPS

### 9.3 安全验收
- 能有效防止恶意刷取
- 不影响正常用户体验
- 无明显安全漏洞