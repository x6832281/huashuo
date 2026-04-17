import asyncio
import aiohttp
import json
import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

async def translate_text(text, style="heal_poem"):
    if not OPENROUTER_API_KEY:
        return get_mock_translation(text)

    try:
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": "openai/gpt-4o",
                "messages": [
                    {
                        "role": "system",
                        "content": "你是一个情绪分析和诗句生成助手，能够将用户的情绪文本转化为对应的诗句，并分析情绪类型。情绪类型分为0（悲伤）、1（中性）、2（开心）。同时生成三个不同风格的贴纸文案：安慰、吃瓜、损友式诋毁。"
                    },
                    {
                        "role": "user",
                        "content": f"请分析以下文本的情绪类型（0-2），并生成一首对应风格的诗句，以及三个不同风格的贴纸文案：\n{text}"
                    }
                ],
                "temperature": 0.7
            }

            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            }

            async with session.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers
            ) as response:
                if response.status != 200:
                    raise Exception(f"API调用失败: {response.status}")

                data = await response.json()
                content = data['choices'][0]['message']['content']
                return parse_ai_response(content)
    except Exception as e:
        print(f"AI翻译失败: {e}")
        return get_mock_translation(text)

def parse_ai_response(content):
    try:
        lines = content.split('\n')
        mood_band = 1
        ai_poem = ""
        stickers = {
            "comfort": "一切都会好的 🌟",
            "gossip": "有点意思 👀",
            "roast": "淡定，小场面 🤣"
        }

        for line in lines:
            line = line.strip()
            if line.startswith("情绪类型:"):
                try:
                    mood_band = int(line.split(":")[1].strip())
                except:
                    pass
            elif line.startswith("诗句:"):
                ai_poem = line.split(":", 1)[1].strip()
            elif line.startswith("安慰:"):
                stickers["comfort"] = line.split(":", 1)[1].strip()
            elif line.startswith("吃瓜:"):
                stickers["gossip"] = line.split(":", 1)[1].strip()
            elif line.startswith("损友:"):
                stickers["roast"] = line.split(":", 1)[1].strip()

        if not ai_poem:
            ai_poem = "月上柳梢人静时"

        return {
            "mood_band": mood_band,
            "ai_poem": ai_poem,
            "stickers": stickers
        }
    except Exception as e:
        print(f"解析AI响应失败: {e}")
        return get_mock_translation("")

def get_mock_translation(text):
    mood_band = 1
    if "伤心" in text or "难过" in text or "哭" in text:
        mood_band = 0
    elif "开心" in text or "高兴" in text or "笑" in text:
        mood_band = 2

    return {
        "mood_band": mood_band,
        "ai_poem": "月上柳梢人静时",
        "stickers": {
            "comfort": "一切都会好的 🌟",
            "gossip": "有点意思 👀",
            "roast": "淡定，小场面 🤣"
        }
    }