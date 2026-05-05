from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from .rate_limiter import RateLimiter

rate_limiter = RateLimiter()

PATH_LIMITS = {
    "/api/ai/translate": 5,
    "/api/share/create": 10,
    "/api/share/hug": 3,
    "/api/share/batch": 5
}

async def rate_limit_middleware(request: Request, call_next):
    ip = request.client.host
    path = request.url.path

    rate_limiter.clear_expired()

    if not rate_limiter.is_path_allowed(ip, path, PATH_LIMITS):
        return JSONResponse(status_code=429, content={"detail": "请求过于频繁，请稍后再试"})

    if not rate_limiter.is_ip_allowed(ip):
        return JSONResponse(status_code=429, content={"detail": "请求过于频繁，请稍后再试"})

    response = await call_next(request)
    return response

def get_rate_limiter():
    """获取限流实例"""
    return rate_limiter