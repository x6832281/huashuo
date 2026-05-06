import { json, cors } from '../lib/response.js';
import { checkRateLimit } from '../lib/rate-limiter.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const localTemplates = {
  0: {
    quotes: [
      '雨打芭蕉夜难眠',
      '成年人的崩溃，往往就在一瞬间',
      '世界那么大，我想去看看',
      '人生就像一杯茶，不会苦一辈子，但总会苦一阵子',
      '你以为的为时已晚，恰恰是最好的开始',
      '生活不是等待暴风雨过去，而是学会在雨中起舞',
      '治愈系诗人说：月亮不会奔向你，但我会',
      '今天也是元气满满的一天（才怪）',
      '世界以痛吻我，我报之以歌',
      '所有的经历都是财富，只是有些太贵了',
    ],
    stickers: {
      comfort: '别难过，有我在 😊',
      gossip: '这瓜有点大 🍉',
      roast: '看开点，小事情 🤪',
    },
  },
  1: {
    quotes: [
      '云卷云舒任自然',
      '生活不止眼前的苟且，还有诗和远方',
      '你所浪费的今天，是昨天死去的人奢望的明天',
      '人生没有彩排，每天都是现场直播',
      '愿你出走半生，归来仍是少年',
      '保持热爱，奔赴山海',
      '温柔半两，从容一生',
      '人间烟火气，最抚凡人心',
      '愿所得皆所期，所失亦无碍',
      '生活明朗，万物可爱',
    ],
    stickers: {
      comfort: '一切都会好的 🌟',
      gossip: '有点意思 👀',
      roast: '淡定，小场面 🤣',
    },
  },
  2: {
    quotes: [
      '春风十里，不如你',
      '阳光正好，微风不燥',
      '今天也是充满希望的一天',
      '好事正在发生',
      '愿所有的美好都如期而至',
      '生活明朗，万物可爱',
      '今日份的开心已送达',
      '遇见的都是天意，拥有的都是幸运',
      '日子甜甜的，像夏天的冰可乐',
      '今天也是值得庆祝的一天',
    ],
    stickers: {
      comfort: '太棒了！🎉',
      gossip: '羡慕了羡慕了 😍',
      roast: '可以啊你 👍',
    },
  },
};

function analyzeMood(text) {
  const negativeKeywords = ['难过', '伤心', '悲伤', '痛苦', '焦虑', '抑郁', '疲惫', '压力', '失望', '绝望', '愤怒', '害怕', '担心', '烦恼', '委屈'];
  const positiveKeywords = ['开心', '快乐', '高兴', '喜悦', '兴奋', '幸福', '满足', '平静', '轻松', '温暖', '感激', '希望', '期待', '成功', '美好'];

  let negativeCount = 0;
  for (const keyword of negativeKeywords) {
    if (text.includes(keyword)) negativeCount++;
  }
  let positiveCount = 0;
  for (const keyword of positiveKeywords) {
    if (text.includes(keyword)) positiveCount++;
  }

  if (negativeCount > positiveCount) return 0;
  if (positiveCount > negativeCount) return 2;
  return 1;
}

function getRandomQuote(moodBand) {
  const quotes = localTemplates[moodBand].quotes;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function getLocalTemplate(text) {
  const moodBand = analyzeMood(text);
  const template = localTemplates[moodBand];
  return {
    mood_band: moodBand,
    ai_poem: getRandomQuote(moodBand),
    stickers: {
      comfort: template.stickers.comfort,
      gossip: template.stickers.gossip,
      roast: template.stickers.roast,
    },
  };
}

function parseAIResponse(content) {
  try {
    const lines = content.split('\n');
    let moodBand = 1;
    let aiPoem = '';
    let comfort = '';
    let gossip = '';
    let roast = '';

    for (const line of lines) {
      if (line.includes('情绪频段:') || line.includes('情绪类型:')) {
        moodBand = parseInt(line.split(':')[1].trim());
      } else if (line.includes('文案:') || line.includes('诗句:') || line.includes('热梗:') || line.includes('名言:') || line.includes('书摘:')) {
        aiPoem = line.split(':').slice(1).join(':').trim();
      } else if (line.includes('安慰:')) {
        comfort = line.split(':')[1].trim();
      } else if (line.includes('吃瓜:')) {
        gossip = line.split(':')[1].trim();
      } else if (line.includes('损友:')) {
        roast = line.split(':')[1].trim();
      }
    }

    return {
      mood_band: moodBand,
      ai_poem: aiPoem || getRandomQuote(moodBand),
      stickers: {
        comfort: comfort || localTemplates[moodBand].stickers.comfort,
        gossip: gossip || localTemplates[moodBand].stickers.gossip,
        roast: roast || localTemplates[moodBand].stickers.roast,
      },
    };
  } catch {
    return getLocalTemplate('');
  }
}

async function callOpenRouter(text, style) {
  const styleHints = {
    heal_poem: '治愈现代诗风格，温暖、轻柔、有力量',
    gossip: '网络热梗、吃瓜吐槽风格，幽默、接地气',
    roast: '损友式吐槽打气风格，夸张吐槽但站你这边',
  };
  const styleHint = styleHints[style] || styleHints.heal_poem;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: `你是一个情绪分析和文案生成助手。你能将用户的情绪文本转化为文案，风格偏好为：${styleHint}。\n\n可选风格包括：网络热梗、名人名言、书摘文案、小说经典语句、古诗词等。请根据用户文本的情绪和指定风格偏好，生成最合适的文案。\n\n情绪类型分为0（悲伤）、1（中性）、2（开心）。\n\n同时生成三个不同风格的贴纸文案：安慰、吃瓜、损友式调侃（吐槽式打气，不攻击人格）。\n\n请严格按照以下格式回复：\n情绪频段: 数字\n文案: 内容\n安慰: 内容\n吃瓜: 内容\n损友: 内容`,
        },
        {
          role: 'user',
          content: `请分析以下文本的情绪类型（0-2），并生成一段对应风格的文案（偏好：${styleHint}），以及三个不同风格的贴纸文案：\n${text}`,
        },
      ],
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  return parseAIResponse(content);
}

export default async function handler(req) {
  const corsResponse = cors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const rateCheck = checkRateLimit(req, '/api/ai/translate');
  if (!rateCheck.allowed) {
    return json({ error: rateCheck.message }, 429);
  }

  try {
    const body = await req.json();
    const { text, style = 'heal_poem' } = body;

    if (!text || text.trim().length === 0) {
      return json({ error: '文本不能为空' }, 400);
    }
    if (text.length > 1000) {
      return json({ error: '文本长度不能超过1000字符' }, 400);
    }

    const validStyles = ['heal_poem', 'gossip', 'roast'];
    if (!validStyles.includes(style)) {
      return json({ error: `风格必须是以下之一: ${validStyles.join(', ')}` }, 400);
    }

    if (!OPENROUTER_API_KEY) {
      return json({ error: 'AI服务未配置' }, 502);
    }

    try {
      const result = await callOpenRouter(text, style);
      return json(result);
    } catch (err) {
      console.warn('AI API failed:', err.message);
      return json({ error: 'AI翻译服务暂时不可用，请稍后重试' }, 502);
    }
  } catch (err) {
    console.error('Translate error:', err);
    return json({ error: '请求处理失败' }, 502);
  }
}
