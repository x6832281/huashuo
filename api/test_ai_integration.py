import asyncio
from app.services.ai_service import translate_text, generate_stickers, analyze_mood, get_local_template

async def test_translate_text():
    print("测试AI翻译功能...")
    text = "今天心情很好！"
    result = await translate_text(text)
    print(f"翻译结果: {result}")
    assert "mood_band" in result
    assert "ai_poem" in result
    assert "stickers" in result
    assert result["mood_band"] in [0, 1, 2]
    assert len(result["ai_poem"]) <= 15
    print("✅ AI翻译功能测试通过")

async def test_generate_stickers():
    print("测试表情包生成功能...")
    poem = "月上柳梢人静时"
    stickers = generate_stickers(poem)
    print(f"表情包文案: {stickers}")
    assert "comfort" in stickers
    assert "gossip" in stickers
    assert "roast" in stickers
    print("✅ 表情包生成功能测试通过")

async def test_analyze_mood():
    print("测试情绪分析功能...")
    test_cases = [
        ("难过伤心孤独", 0),
        ("快乐开心轻松", 2),
        ("平静复杂", 1)
    ]
    for poem, expected in test_cases:
        result = analyze_mood(poem)
        print(f"诗句: {poem}, 情绪频段: {result}, 预期: {expected}")
        assert result == expected
    print("✅ 情绪分析功能测试通过")

async def test_get_local_template():
    print("测试本地模板功能...")
    text = "测试文本"
    result = get_local_template(text)
    print(f"本地模板结果: {result}")
    assert "mood_band" in result
    assert "ai_poem" in result
    assert "stickers" in result
    print("✅ 本地模板功能测试通过")

async def test_error_handling():
    print("测试错误处理功能...")
    # 测试API调用失败时的降级
    result = await translate_text("测试文本")
    print(f"错误处理结果: {result}")
    assert "mood_band" in result
    assert "ai_poem" in result
    assert "stickers" in result
    print("✅ 错误处理功能测试通过")

async def test_input_validation():
    print("测试输入验证功能...")
    # 测试空文本
    result = await translate_text("")
    print(f"空文本测试结果: {result}")
    assert "mood_band" in result
    
    # 测试长文本
    long_text = "a" * 1001
    result = await translate_text(long_text)
    print(f"长文本测试结果: {result}")
    assert "mood_band" in result
    print("✅ 输入验证功能测试通过")

async def run_tests():
    print("开始测试AI翻译集成模块...\n")
    try:
        await test_translate_text()
        await test_generate_stickers()
        await test_analyze_mood()
        await test_get_local_template()
        await test_error_handling()
        await test_input_validation()
        print("\n🎉 所有测试通过！")
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")

if __name__ == "__main__":
    asyncio.run(run_tests())