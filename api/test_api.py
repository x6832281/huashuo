import asyncio
import aiohttp
import json

BASE_URL = "http://localhost:8000"

async def test_health_check():
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/health") as response:
            data = await response.json()
            print(f"健康检查: {data}")
            assert response.status == 200
            assert data["status"] == "healthy"

async def test_ai_translation():
    async with aiohttp.ClientSession() as session:
        payload = {
            "text": "今天心情很好！",
            "style": "heal_poem"
        }
        async with session.post(f"{BASE_URL}/api/ai/translate", json=payload) as response:
            data = await response.json()
            print(f"AI翻译: {data}")
            assert response.status == 200
            assert "mood_band" in data
            assert "ai_poem" in data
            assert "stickers" in data

async def test_share_create():
    async with aiohttp.ClientSession() as session:
        payload = {
            "ai_poem": "月上柳梢人静时",
            "mood_band": 1
        }
        async with session.post(f"{BASE_URL}/api/share/create", json=payload) as response:
            data = await response.json()
            print(f"分享创建: {data}")
            assert response.status == 200
            assert "share_id" in data
            assert "share_url" in data
            return data["share_id"]

async def test_hug(share_id):
    async with aiohttp.ClientSession() as session:
        payload = {
            "share_id": share_id,
            "device_id": "test-device-123"
        }
        async with session.post(f"{BASE_URL}/api/share/hug", json=payload) as response:
            data = await response.json()
            print(f"拥抱: {data}")
            assert response.status == 200
            assert "hugs_count" in data

async def test_batch_hug(share_id):
    async with aiohttp.ClientSession() as session:
        payload = {
            "share_ids": [share_id]
        }
        async with session.post(f"{BASE_URL}/api/share/batch", json=payload) as response:
            data = await response.json()
            print(f"批量拥抱: {data}")
            assert response.status == 200
            assert "items" in data
            assert len(data["items"]) > 0

async def run_tests():
    print("开始测试API服务模块...\n")
    try:
        await test_health_check()
        await test_ai_translation()
        share_id = await test_share_create()
        await test_hug(share_id)
        await test_batch_hug(share_id)
        print("\n🎉 所有测试通过！")
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")

if __name__ == "__main__":
    asyncio.run(run_tests())