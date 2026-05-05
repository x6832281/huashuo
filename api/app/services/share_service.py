import asyncio
import uuid
import os
import time
from dotenv import load_dotenv
from supabase import create_client, Client
from app.utils.middleware import rate_limiter

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

_mock_hugs = {}

def generate_share_id():
    return str(uuid.uuid4())

async def create_share(ai_poem, mood_band):
    share_id = generate_share_id()
    share_url = f"https://huashuo.app/s/{share_id}"

    if not ai_poem or len(ai_poem.strip()) == 0:
        raise ValueError("诗句不能为空")
    if mood_band not in [0, 1, 2]:
        raise ValueError("情绪类型必须是0、1或2")

    if supabase:
        try:
            response = await supabase.table('shared_cards').insert({
                'share_id': share_id,
                'ai_poem': ai_poem,
                'mood_band': mood_band,
                'hugs_count': 0
            }).execute()
            if not response.data:
                raise Exception("创建分享卡片失败")
        except Exception as e:
            print(f"创建分享失败: {e}")

    _mock_hugs[share_id] = 0

    return {
        "share_id": share_id,
        "share_url": share_url
    }

async def add_hug(share_id, device_id):
    if not share_id:
        raise ValueError("分享ID不能为空")
    if not device_id:
        raise ValueError("设备ID不能为空")

    if not rate_limiter.is_device_allowed(device_id, share_id):
        current = _mock_hugs.get(share_id, 0) if not supabase else await get_hug_count(share_id)
        return {"hugs_count": current, "message": "今日已拥抱"}

    if supabase:
        try:
            existing_card = await supabase.table('shared_cards').select('*').eq('share_id', share_id).execute()
            if not existing_card.data:
                raise Exception("分享卡片不存在")
            existing_hug = await supabase.table('hugs').select('id').eq('share_id', share_id).eq('device_id', device_id).execute()
            if len(existing_hug.data) == 0:
                await supabase.table('shared_cards').update({
                    'hugs_count': supabase.db.raw('hugs_count + 1'),
                    'updated_at': supabase.db.raw('NOW()'),
                    'last_hug_at': supabase.db.raw('NOW()')
                }).eq('share_id', share_id).execute()
                await supabase.table('hugs').insert({
                    'share_id': share_id,
                    'device_id': device_id
                }).execute()
            share = await supabase.table('shared_cards').select('hugs_count').eq('share_id', share_id).execute()
            hugs_count = share.data[0]['hugs_count'] if share.data else 0
        except Exception as e:
            print(f"增加拥抱失败: {e}")
            _mock_hugs[share_id] = _mock_hugs.get(share_id, 0) + 1
            hugs_count = _mock_hugs[share_id]
    else:
        _mock_hugs[share_id] = _mock_hugs.get(share_id, 0) + 1
        hugs_count = _mock_hugs[share_id]

    return {"hugs_count": hugs_count}

async def batch_get_hugs(share_ids):
    items = []

    if not share_ids or len(share_ids) == 0:
        return {"items": []}
    if len(share_ids) > 100:
        raise ValueError("分享ID列表长度不能超过100")

    if supabase:
        try:
            response = await supabase.table('shared_cards').select('share_id, hugs_count').in_('share_id', share_ids).execute()
            if response.data:
                items = [{"share_id": item["share_id"], "hugs_count": item["hugs_count"]} for item in response.data]
        except Exception as e:
            print(f"批量获取拥抱数失败: {e}")
            for sid in share_ids:
                items.append({"share_id": sid, "hugs_count": _mock_hugs.get(sid, 0)})
    else:
        for sid in share_ids:
            items.append({"share_id": sid, "hugs_count": _mock_hugs.get(sid, 0)})

    return {"items": items}

async def get_share_by_id(share_id):
    if not share_id:
        raise ValueError("分享ID不能为空")
    if supabase:
        try:
            response = await supabase.table('shared_cards').select('*').eq('share_id', share_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"获取分享卡片失败: {e}")
            return None
    return None

async def get_hug_count(share_id):
    if not share_id:
        raise ValueError("分享ID不能为空")
    if supabase:
        try:
            response = await supabase.table('shared_cards').select('hugs_count').eq('share_id', share_id).execute()
            return response.data[0]['hugs_count'] if response.data else 0
        except Exception as e:
            print(f"获取拥抱数失败: {e}")
            return 0
    return _mock_hugs.get(share_id, 0)
