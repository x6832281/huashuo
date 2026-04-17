from pydantic import BaseModel, field_validator
from typing import List, Optional

class TranslationRequestValidator(BaseModel):
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

class ShareCreateRequestValidator(BaseModel):
    ai_poem: str
    mood_band: int

    @field_validator('ai_poem')
    @classmethod
    def poem_not_empty(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('诗句不能为空')
        return v

    @field_validator('mood_band')
    @classmethod
    def mood_band_valid(cls, v):
        if v not in [0, 1, 2]:
            raise ValueError('情绪类型必须是0、1或2')
        return v

class HugRequestValidator(BaseModel):
    share_id: str
    device_id: str

    @field_validator('share_id')
    @classmethod
    def share_id_not_empty(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('分享ID不能为空')
        return v

    @field_validator('device_id')
    @classmethod
    def device_id_not_empty(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('设备ID不能为空')
        return v

class BatchHugRequestValidator(BaseModel):
    share_ids: List[str]

    @field_validator('share_ids')
    @classmethod
    def share_ids_not_empty(cls, v):
        if not v or len(v) == 0:
            raise ValueError('分享ID列表不能为空')
        if len(v) > 100:
            raise ValueError('分享ID列表长度不能超过100')
        return v