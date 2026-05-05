from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from app.services.ai_service import translate_text

router = APIRouter()

class TranslationRequest(BaseModel):
    text: str
    style: str = "heal_poem"

    @field_validator('text')
    @classmethod
    def text_not_empty(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('文本不能为空')
        if len(v) > 1000:
            raise ValueError('文本长度不能超过1000字符')
        return v

    @field_validator('style')
    @classmethod
    def style_valid(cls, v):
        valid_styles = ['heal_poem', 'gossip', 'roast']
        if v not in valid_styles:
            raise ValueError(f'风格必须是以下之一: {valid_styles}')
        return v

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