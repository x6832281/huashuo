import asyncio
import uuid
import os
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

def generate_share_id():
    return str(uuid.uuid4())

async def create_share(ai_poem, mood_band):
    share_id = generate_share_id()
    share_url = f"https://huashuo.app/s/{share_id}"

    # 数据验证
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
            # 降级到本地处理
            pass

    return {
        "share_id": share_id,
        "share_url": share_url
    }

async def add_hug(share_id, device_id):
    hugs_count = 0

    # 数据验证
    if not share_id:
        raise ValueError("分享ID不能为空")
    if not device_id:
        raise ValueError("设备ID不能为空")

    # 检查拥抱防刷
    if not rate_limiter.is_device_allowed(device_id, share_id):
        raise Exception("您今天已经给这个卡片送过拥抱了")

    if supabase:
        try:
            # 检查share_id是否存在
            existing_card = await supabase.table('shared_cards').select('*').eq('share_id', share_id).execute()
            
            if not existing_card.data:
                raise Exception("分享卡片不存在")
            
            # 检查是否已经拥抱过
            existing_hug = await supabase.table('hugs').select('id').eq('share_id', share_id).eq('device_id', device_id).execute()
            if len(existing_hug.data) == 0:
                # 增加拥抱计数
                await supabase.table('shared_cards').update({
                    'hugs_count': supabase.db.raw('hugs_count + 1'),
                    'updated_at': supabase.db.raw('NOW()'),
                    'last_hug_at': supabase.db.raw('NOW()')
                }).eq('share_id', share_id).execute()
                # 记录拥抱
                await supabase.table('hugs').insert({
                    'share_id': share_id,
                    'device_id': device_id
                }).execute()
            
            # 获取最新拥抱数
            share = await supabase.table('shared_cards').select('hugs_count').eq('share_id', share_id).execute()
            if share.data:
                hugs_count = share.data[0]['hugs_count']
        except Exception as e:
            print(f"增加拥抱失败: {e}")
            # 降级到本地处理
            hugs_count = 1
    else:
        # 模拟数据
        hugs_count = 1

    return {
        "hugs_count": hugs_count
    }

async def batch_get_hugs(share_ids):
    items = []

    # 数据验证
    if not share_ids or len(share_ids) == 0:
        return {"items": []}
    if len(share_ids) > 100:
        raise ValueError("分享ID列表长度不能超过100")

    if supabase:
        try:
            response = await supabase.table('shared_cards').select('share_id, hugs_count').in_('share_id', share_ids).execute()
            
            if response.data:
                items = [
                    {"share_id": item["share_id"], "hugs_count": item["hugs_count"]}
                    for item in response.data
                ]
        except Exception as e:
            print(f"批量获取拥抱数失败: {e}")
            # 降级到本地处理
            for share_id in share_ids:
                items.append({
                    "share_id": share_id,
                    "hugs_count": 5
                })
    else:
        # 模拟数据
        for share_id in share_ids:
            items.append({
                "share_id": share_id,
                "hugs_count": 5
            })

    return {
        "items": items
    }

async def get_share_by_id(share_id):
    if not share_id:
        raise ValueError("分享ID不能为空")

    if supabase:
        try:
            response = await supabase.table('shared_cards').select('*').eq('share_id', share_id).execute()
            if response.data:
                return response.data[0]
            else:
                return None
        except Exception as e:
            print(f"获取分享卡片失败: {e}")
            return None
    else:
        return None

async def get_hug_count(share_id):
    if not share_id:
        raise ValueError("分享ID不能为空")

    if supabase:
        try:
            response = await supabase.table('shared_cards').select('hugs_count').eq('share_id', share_id).execute()
            if response.data:
                return response.data[0]['hugs_count']
            else:
                return 0
        except Exception as e:
            print(f"获取拥抱数失败: {e}")
            return 0
    else:
        return 0