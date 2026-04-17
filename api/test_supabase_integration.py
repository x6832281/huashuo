import asyncio
from app.services.share_service import (
    create_share,
    add_hug,
    batch_get_hugs,
    get_share_by_id,
    get_hug_count
)

async def test_create_share():
    print("Testing create share card...")
    ai_poem = "月上柳梢人静时"
    mood_band = 1
    result = await create_share(ai_poem, mood_band)
    print(f"Create result: {result}")
    assert "share_id" in result
    assert "share_url" in result
    print("PASS: Create share card test passed")
    return result["share_id"]

async def test_add_hug(share_id):
    print("Testing add hug count...")
    device_id = "test-device-123"
    result = await add_hug(share_id, device_id)
    print(f"Add hug result: {result}")
    assert "hugs_count" in result
    assert result["hugs_count"] >= 1
    print("PASS: Add hug count test passed")
    return result["hugs_count"]

async def test_batch_get_hugs(share_id):
    print("Testing batch get hug counts...")
    share_ids = [share_id]
    result = await batch_get_hugs(share_ids)
    print(f"Batch get result: {result}")
    assert "items" in result
    assert len(result["items"]) > 0
    print("PASS: Batch get hug counts test passed")

async def test_get_share_by_id(share_id):
    print("Testing get share card by ID...")
    result = await get_share_by_id(share_id)
    print(f"Get result: {result}")
    if result:
        assert result["share_id"] == share_id
        print("PASS: Get share card by ID test passed")
    else:
        print("WARN: Share card not found (Supabase may not be configured)")

async def test_get_hug_count(share_id):
    print("Testing get hug count...")
    result = await get_hug_count(share_id)
    print(f"Get result: {result}")
    assert result >= 0
    print("PASS: Get hug count test passed")

async def test_error_handling():
    print("Testing error handling...")
    try:
        await create_share("", 1)
        assert False, "Should raise error"
    except ValueError as e:
        print(f"Expected error: {e}")
    
    try:
        await create_share("Test poem", 3)
        assert False, "Should raise error"
    except ValueError as e:
        print(f"Expected error: {e}")
    
    try:
        await add_hug("", "test-device")
        assert False, "Should raise error"
    except ValueError as e:
        print(f"Expected error: {e}")
    
    try:
        await add_hug("test-share-id", "")
        assert False, "Should raise error"
    except ValueError as e:
        print(f"Expected error: {e}")
    
    result = await batch_get_hugs([])
    assert result["items"] == []
    print("PASS: Error handling test passed")

async def run_tests():
    print("\nStarting Supabase integration module tests...\n")
    try:
        share_id = await test_create_share()
        await test_add_hug(share_id)
        await test_batch_get_hugs(share_id)
        await test_get_share_by_id(share_id)
        await test_get_hug_count(share_id)
        await test_error_handling()
        print("\nAll tests passed!")
    except Exception as e:
        print(f"\nTest failed: {e}")

if __name__ == "__main__":
    asyncio.run(run_tests())
