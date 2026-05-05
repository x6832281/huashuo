from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes import ai, share
from app.utils.error_handler import setup_error_handlers
from app.utils.middleware import rate_limit_middleware

app = FastAPI()

import os

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "https://huashuo.app,https://www.huashuo.app,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def rate_limit(request: Request, call_next):
    return await rate_limit_middleware(request, call_next)

# 注册路由
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(share.router, prefix="/api/share", tags=["share"])

# 设置错误处理
setup_error_handlers(app)

@app.get("/")
async def root():
    return {"message": "Huashuo API Service"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}