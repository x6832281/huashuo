from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import ai, share
from app.utils.error_handler import setup_error_handlers

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

# 设置错误处理
setup_error_handlers(app)

@app.get("/")
async def root():
    return {"message": "Huashuo API Service"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}