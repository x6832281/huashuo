import time
import asyncio
import pytest
from app.utils.rate_limiter import RateLimiter
from app.utils.middleware import PATH_LIMITS

@pytest.mark.asyncio
async def test_ip_rate_limit():
    rate_limiter = RateLimiter()
    ip = "192.168.1.1"
    
    for i in range(3):
        assert rate_limiter.is_ip_allowed(ip, limit=3), f"Request {i+1} should be allowed"
    
    assert not rate_limiter.is_ip_allowed(ip, limit=3), "Request exceeding limit should be rejected"

@pytest.mark.asyncio
async def test_device_rate_limit():
    rate_limiter = RateLimiter()
    device_id = "test-device-123"
    
    assert rate_limiter.is_device_allowed(device_id), "First request should be allowed"
    assert not rate_limiter.is_device_allowed(device_id), "Second request should be rejected"

@pytest.mark.asyncio
async def test_hug_anti_brush():
    rate_limiter = RateLimiter()
    device_id = "test-device-123"
    share_id = "test-share-123"
    
    assert rate_limiter.is_device_allowed(device_id, share_id), "First hug should be allowed"
    assert not rate_limiter.is_device_allowed(device_id, share_id), "Second hug should be rejected"

@pytest.mark.asyncio
async def test_path_rate_limit():
    rate_limiter = RateLimiter()
    ip = "192.168.1.1"
    path = "/api/ai/translate"
    limit = PATH_LIMITS[path]
    
    for i in range(limit):
        assert rate_limiter.is_path_allowed(ip, path, PATH_LIMITS), f"Request {i+1} should be allowed"
    
    assert not rate_limiter.is_path_allowed(ip, path, PATH_LIMITS), "Request exceeding limit should be rejected"

@pytest.mark.asyncio
async def test_clear_expired():
    rate_limiter = RateLimiter()
    ip = "192.168.1.1"
    
    rate_limiter.is_ip_allowed(ip)
    assert len(rate_limiter.ip_requests) > 0, "Should have IP request records"
    
    rate_limiter.clear_expired()
    assert len(rate_limiter.ip_requests) > 0, "Should still have IP request records after clear (not expired yet)"

@pytest.mark.asyncio
async def test_get_stats():
    rate_limiter = RateLimiter()
    ip = "192.168.1.1"
    device_id = "test-device-123"
    share_id = "test-share-123"
    path = "/api/ai/translate"
    
    rate_limiter.is_ip_allowed(ip)
    rate_limiter.is_device_allowed(device_id)
    rate_limiter.is_device_allowed(device_id, share_id)
    rate_limiter.is_path_allowed(ip, path, PATH_LIMITS)
    
    stats = rate_limiter.get_stats()
    assert stats["ip_requests_count"] > 0, "Should have IP request stats"
    assert stats["device_requests_count"] > 0, "Should have device request stats"
    assert stats["hug_requests_count"] > 0, "Should have hug request stats"
    assert stats["path_requests_count"] > 0, "Should have path request stats"

@pytest.mark.asyncio
async def test_edge_cases():
    rate_limiter = RateLimiter()
    
    assert rate_limiter.is_ip_allowed(""), "Empty IP should be allowed"
    assert rate_limiter.is_device_allowed(""), "Empty device ID should be allowed"
    assert rate_limiter.is_path_allowed("192.168.1.1", "", PATH_LIMITS), "Empty path should be allowed"

async def run_tests():
    print("\nStarting rate limiter module tests...\n")
    try:
        await test_ip_rate_limit()
        await test_device_rate_limit()
        await test_hug_anti_brush()
        await test_path_rate_limit()
        await test_clear_expired()
        await test_get_stats()
        await test_edge_cases()
        print("\nAll tests passed!")
    except Exception as e:
        print(f"\nTest failed: {e}")

if __name__ == "__main__":
    asyncio.run(run_tests())
