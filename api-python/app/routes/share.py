from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.share_service import create_share, add_hug, batch_get_hugs

router = APIRouter()

class ShareCreateRequest(BaseModel):
    ai_poem: str
    mood_band: int

class ShareCreateResponse(BaseModel):
    share_id: str
    share_url: str

class HugRequest(BaseModel):
    share_id: str
    device_id: str

class HugResponse(BaseModel):
    hugs_count: int

class BatchHugRequest(BaseModel):
    share_ids: List[str]

class HugItem(BaseModel):
    share_id: str
    hugs_count: int

class BatchHugResponse(BaseModel):
    items: List[HugItem]

@router.post("/create", response_model=ShareCreateResponse)
async def create(request: ShareCreateRequest):
    try:
        result = await create_share(request.ai_poem, request.mood_band)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hug", response_model=HugResponse)
async def hug(request: HugRequest):
    try:
        result = await add_hug(request.share_id, request.device_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch", response_model=BatchHugResponse)
async def batch(request: BatchHugRequest):
    try:
        result = await batch_get_hugs(request.share_ids)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))