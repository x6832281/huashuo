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