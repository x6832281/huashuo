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
    
    # 清理过期数据
    rate_limiter.clear_expired()
    
    # 检查路径限流
    if not rate_limiter.is_path_allowed(ip, path, PATH_LIMITS):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")
    
    # 检查IP限流
    if not rate_limiter.is_ip_allowed(ip):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")
    
    response = await call_next(request)
    return response

def get_rate_limiter():
    """获取限流实例"""
    return rate_limiter