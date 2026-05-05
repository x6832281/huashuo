/**
 * ============================================
 * AI翻译模块 (aiTranslation.js)
 * ============================================
 * 
 * 功能说明：
 * 本模块负责调用AI API进行情绪分析和内容生成，包括诗句和表情包文案。
 * 如果API调用失败，会自动降级到本地模板。
 * 
 * 工作流程：
 * 1. 尝试调用OpenRouter API（GPT-4o模型）
 * 2. 如果API调用失败或没有API Key，使用本地模板
 * 3. 本地模板根据情绪频段提供预设的诗句和表情包
 * 
 * AI生成内容：
 * - 情绪频段分析：分析文本情绪，确定属于0-2哪个频段
 * - 诗句生成：根据情绪频段生成一句简洁的诗句（≤15字）
 * - 表情包文案：生成三类表情包文案（安慰类、吃瓜类、损友类）
 * 
 * 降级策略：
 * - 优先使用AI API生成个性化内容
 * - API失败时降级到本地模板（本地模板包含预设的诗句和表情包）
 * - 确保在任何网络条件下都能正常工作
 * 
 * 本地模板内容：
 * - 频段0（🌧️低落）：伤感诗句 + 安慰/吃瓜/损友表情包
 * - 频段1（🌤️平静）：中性诗句 + 安慰/吃瓜/损友表情包
 * - 频段2（☀️积极）：阳光诗句 + 安慰/吃瓜/损友表情包
 * 
 * 作者：话说APP开发团队
 * 创建日期：2024年
 * 最后更新：2026年4月
 */

/**
 * AI翻译模块类
 * 实现了AI情绪分析、诗句生成、表情包文案生成的完整流程
 */
class AITranslationModule {
  /**
   * 构造函数：初始化API配置和本地模板
   * 设置OpenRouter API端点、API Key以及各情绪频段的本地模板
   */
  constructor() {
    this.apiEndpoint = '/api/ai/translate';
    this.apiKey = '';
    
    // 本地模板：当API调用失败时使用
    // 包含三个情绪频段（0、1、2）的预设内容
    // 每个频段包含诗句列表和三类型表情包文案
    this.localTemplates = {
      // 频段0：低落/焦虑/疲惫（负面情绪）
      0: {
        // 伤感诗句列表（5首）
        poems: [
          '雨打芭蕉夜难眠',
          '心事如潮暗自涌',
          '孤灯残影照清愁',
          '云遮明月心黯然',
          '风过无痕心已凉'
        ],
        // 三类型表情包文案
        stickers: {
          comfort: '别难过，有我在 😊',    // 安慰类
          gossip: '这瓜有点大 🍉',         // 吃瓜类
          roast: '看开点，小事情 🤪'       // 损友类（吐槽式打气）
        }
      },
      // 频段1：平静/波动/复杂（中性情绪）
      1: {
        // 中性诗句列表（5首）
        poems: [
          '云卷云舒任自然',
          '花开花落两由之',
          '风过湖面起涟漪',
          '月上柳梢人静时',
          '潮起潮落寻常事'
        ],
        // 三类型表情包文案
        stickers: {
          comfort: '一切都会好的 🌟',      // 安慰类
          gossip: '有点意思 👀',           // 吃瓜类
          roast: '淡定，小场面 🤣'         // 损友类
        }
      },
      // 频段2：轻松/积极/被接住（正面情绪）
      2: {
        // 阳光诗句列表（5首）
        poems: [
          '阳光明媚心花开',
          '春风拂面笑开颜',
          '花香满径心欢喜',
          '云淡风轻天地宽',
          '心若向阳花自开'
        ],
        // 三类型表情包文案
        stickers: {
          comfort: '太棒了！🎉',            // 安慰类（庆祝式）
          gossip: '羡慕了羡慕了 😍',      // 吃瓜类（羡慕式）
          roast: '可以啊你 👍'            // 损友类（夸奖式）
        }
      }
    };
  }

  /**
   * 翻译文本（主入口方法）
   * 尝试调用API，失败则降级到本地模板
   * 
   * 工作流程：
   * 1. 检查是否有API Key
   * 2. 如果有API Key，调用API生成内容
   * 3. 如果API调用失败，降级到本地模板
   * 4. 返回生成的内容（包含情绪频段、诗句、表情包）
   * 
   * 降级策略：
   * - 优先使用API生成个性化内容
   * - API失败时无缝降级到本地模板
   * - 确保任何情况下都能返回有效内容
   * 
   * @param {string} text - 要翻译的文本内容
   * @param {string} [style='heal_poem'] - 翻译风格（目前仅支持heal_poem）
   * @returns {Promise<Object>} 返回翻译结果
   *   格式：{
   *     mood_band: 0,                    // 情绪频段（0-2）
   *     ai_poem: '诗句内容',              // AI生成的诗句
   *     stickers: {                      // 表情包文案
   *       comfort: '安慰类文案',
   *       gossip: '吃瓜类文案',
   *       roast: '损友类文案'
   *     }
   *   }
   */
  async translateText(text, style = 'heal_poem') {
    try {
      return await this.callAPI(text, style);
    } catch (error) {
      console.warn('API call failed, using local template:', error.message);
      return this.getLocalTemplate(text);
    }
  }

  async callAPI(text, style) {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, style })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.mood_band !== undefined && data.ai_poem && data.stickers) {
      return {
        mood_band: data.mood_band,
        ai_poem: data.ai_poem,
        stickers: data.stickers
      };
    }

    throw new Error('Invalid API response format');
  }

  /**
   * 解析API响应内容
   * 将AI的文本回复解析为结构化的对象
   * 
   * 期望的回复格式：
   * 情绪频段: 0
   * 诗句: 雨打芭蕉夜难眠
   * 安慰: 别难过，有我在 😊
   * 吃瓜: 这瓜有点大 🍉
   * 损友: 看开点，小事情 🤪
   * 
   * 解析逻辑：
   * 1. 按行分割回复内容
   * 2. 逐行解析，提取情绪频段、诗句、表情包文案
   * 3. 如果某项解析失败，使用本地模板的对应内容作为备选
   * 4. 返回结构化的结果对象
   * 
   * 容错机制：
   * 如果解析失败（格式不匹配），降级到本地模板
   * 
   * @param {string} content - AI的文本回复内容
   * @returns {Object} 返回解析后的结构化对象
   */
  parseAPIResponse(content) {
    try {
      // 按行分割回复内容
      const lines = content.split('\n');
      
      // 初始化变量，设置默认值
      let moodBand = 1;      // 默认情绪频段为1（平静）
      let aiPoem = '';       // AI生成的诗句
      let comfort = '';      // 安慰类表情包文案
      let gossip = '';       // 吃瓜类表情包文案
      let roast = '';        // 损友类表情包文案

      // 逐行解析
      for (const line of lines) {
        // 解析情绪频段
        if (line.includes('情绪频段:')) {
          // 提取冒号后的数字，转换为整数
          moodBand = parseInt(line.split(':')[1].trim());
        } 
        // 解析诗句
        else if (line.includes('诗句:')) {
          aiPoem = line.split(':')[1].trim();
        } 
        // 解析安慰类文案
        else if (line.includes('安慰:')) {
          comfort = line.split(':')[1].trim();
        } 
        // 解析吃瓜类文案
        else if (line.includes('吃瓜:')) {
          gossip = line.split(':')[1].trim();
        } 
        // 解析损友类文案
        else if (line.includes('损友:')) {
          roast = line.split(':')[1].trim();
        }
      }

      // 返回结构化的结果对象
      return {
        mood_band: moodBand,    // 情绪频段
        // AI诗句，如果为空则从本地模板随机获取
        ai_poem: aiPoem || this.getRandomPoem(moodBand),
        stickers: {
          // 三类型表情包文案，如果为空则使用本地模板
          comfort: comfort || this.localTemplates[moodBand].stickers.comfort,
          gossip: gossip || this.localTemplates[moodBand].stickers.gossip,
          roast: roast || this.localTemplates[moodBand].stickers.roast
        }
      };
    } catch (error) {
      // 解析失败，降级到本地模板
      console.warn('Failed to parse API response, using local template:', error);
      return this.getLocalTemplate('');
    }
  }

  /**
   * 分析文本情绪（本地方法）
   * 使用关键词匹配进行情绪分析，与emotionTreeHoleModule中的算法相同
   * 
   * 分析算法：
   * 1. 统计文本中包含的负面情绪词数量
   * 2. 统计文本中包含的正面情绪词数量
   * 3. 比较两个数量：
   *    - 负面词数量 > 正面词数量 => 频段0（低落）
   *    - 正面词数量 > 负面词数量 => 频段2（积极）
   *    - 情绪词数量相等 => 频段1（平静）
   * 
   * 为什么需要这个方法？
   * - API调用失败时，用于确定情绪频段
   * - 从本地模板中选取对应频段的诗句和表情包
   * 
   * @param {string} text - 要分析的文本内容
   * @returns {number} 返回分析得到的情绪频段值（0、1或2）
   */
  analyzeMood(text) {
    try {
      // 将文本转换为小写（虽然中文不需要，但为了统一处理）
      const contentLower = text.toLowerCase();
      
      // 定义负面情绪词列表
      const negativeKeywords = ['难过', '伤心', '悲伤', '痛苦', '焦虑', '抑郁', '疲惫', '压力', '失望', '绝望', '愤怒', '害怕', '担心', '烦恼', '委屈'];
      
      // 定义正面情绪词列表
      const positiveKeywords = ['开心', '快乐', '高兴', '喜悦', '兴奋', '幸福', '满足', '平静', '轻松', '温暖', '感激', '希望', '期待', '成功', '美好'];
      
      // 统计负面情绪词数量
      let negativeCount = 0;
      for (const keyword of negativeKeywords) {
        if (text.includes(keyword)) {
          negativeCount++;
        }
      }
      
      // 统计正面情绪词数量
      let positiveCount = 0;
      for (const keyword of positiveKeywords) {
        if (text.includes(keyword)) {
          positiveCount++;
        }
      }
      
      // 比较情绪词数量，确定情绪频段
      if (negativeCount > positiveCount) {
        return 0; // 负面情绪更多，返回频段0（低落/焦虑/疲惫）
      } else if (positiveCount > negativeCount) {
        return 2; // 正面情绪更多，返回频段2（轻松/积极/被接住）
      } else {
        return 1; // 情绪词数量相等或都没有，返回频段1（平静/波动/复杂）
      }
    } catch (error) {
      // 情绪分析失败，返回默认的频段1
      console.error('Mood analysis failed:', error);
      return 1; // 默认返回平静/波动/复杂
    }
  }

  /**
   * 获取本地模板内容
   * 根据文本情绪分析结果，从本地模板中选取对应频段的诗句和表情包
   * 
   * 使用场景：
   * - API调用失败时的降级方案
   * - 没有API Key时的默认方案
   * - 网络不稳定时的备选方案
   * 
   * @param {string} text - 要分析的文本内容
   * @returns {Object} 返回本地模板内容
   *   格式：{
   *     mood_band: 0,                    // 分析得到的情绪频段
   *     ai_poem: '诗句内容',              // 从本地模板随机选取的诗句
   *     stickers: {                      // 本地模板的表情包文案
   *       comfort: '安慰类文案',
   *       gossip: '吃瓜类文案',
   *       roast: '损友类文案'
   *     }
   *   }
   */
  getLocalTemplate(text) {
    // 分析文本情绪，确定情绪频段
    const moodBand = this.analyzeMood(text);
    
    // 获取对应频段的本地模板
    const template = this.localTemplates[moodBand];
    
    // 返回本地模板内容
    return {
      mood_band: moodBand,                // 分析得到的情绪频段
      ai_poem: this.getRandomPoem(moodBand),  // 从本地模板随机选取的诗句
      stickers: {
        comfort: template.stickers.comfort,   // 安慰类文案
        gossip: template.stickers.gossip,     // 吃瓜类文案
        roast: template.stickers.roast        // 损友类文案
      }
    };
  }

  /**
   * 从本地模板中随机获取一首诗句
   * 根据情绪频段，从对应的诗句列表中随机选取一首
   * 
   * @param {number} moodBand - 情绪频段（0、1或2）
   * @returns {string} 返回随机选取的诗句
   */
  getRandomPoem(moodBand) {
    // 获取对应频段的诗句列表
    const poems = this.localTemplates[moodBand].poems;
    
    // 生成随机索引
    // Math.random() 生成0-1之间的随机数
    // 乘以诗句数量，取整，得到0到(诗句数量-1)之间的整数
    const randomIndex = Math.floor(Math.random() * poems.length);
    
    // 返回随机选取的诗句
    return poems[randomIndex];
  }

  /**
   * 验证AI响应内容的格式
   * 检查响应对象是否符合预期的格式要求
   * 
   * 验证规则：
   * 1. 响应对象不能为空
   * 2. mood_band必须是0-2之间的数字
   * 3. ai_poem必须存在且长度不超过15字
   * 4. stickers必须是对象，且包含comfort、gossip、roast三个字段
   * 
   * 为什么需要验证？
   * - 确保API返回的内容格式正确
   * - 避免后续处理时出现错误
   * - 提供数据质量保障
   * 
   * @param {Object} response - 要验证的响应对象
   * @returns {boolean} 返回验证结果（true=通过，false=失败）
   */
  validateResponse(response) {
    // 检查响应对象是否为空
    if (!response) {
      return false;
    }
    
    // 检查情绪频段：必须是0-2之间的数字
    if (typeof response.mood_band !== 'number' || response.mood_band < 0 || response.mood_band > 2) {
      return false;
    }
    
    // 检查诗句：必须存在且长度不超过15字
    if (!response.ai_poem || response.ai_poem.length > 15) {
      return false;
    }
    
    // 检查表情包：必须是对象类型
    if (!response.stickers || typeof response.stickers !== 'object') {
      return false;
    }
    
    // 检查表情包类型：必须包含comfort、gossip、roast三个字段
    const stickerTypes = ['comfort', 'gossip', 'roast'];
    for (const type of stickerTypes) {
      if (!response.stickers[type]) {
        return false;
      }
    }
    
    // 所有验证通过
    return true;
  }

  /**
   * 批量翻译文本
   * 对多个文本进行翻译，返回每个文本的结果
   * 
   * 工作流程：
   * 1. 遍历所有文本
   * 2. 对每个文本调用translateText方法
   * 3. 捕获异常，确保单个文本失败不影响其他文本
   * 4. 返回所有结果数组
   * 
   * 结果格式：
   * - 成功：{ text: '原文', result: {...}, success: true }
   * - 失败：{ text: '原文', error: '错误信息', success: false }
   * 
   * 为什么需要批量翻译？
   * - 可能有多条心事需要同时处理
   * - 批量处理可以提高效率
   * - 单个失败不影响其他文本
   * 
   * @param {Array<string>} texts - 要翻译的文本数组
   * @param {string} [style='heal_poem'] - 翻译风格
   * @returns {Promise<Array>} 返回翻译结果数组
   */
  async batchTranslate(texts, style = 'heal_poem') {
    // 存储所有翻译结果
    const results = [];
    
    // 遍历所有文本
    for (const text of texts) {
      try {
        // 尝试翻译单个文本
        const result = await this.translateText(text, style);
        
        // 翻译成功，记录结果
        results.push({
          text: text,           // 原文
          result: result,       // 翻译结果
          success: true         // 成功标记
        });
      } catch (error) {
        // 翻译失败，记录错误信息
        // 注意：这里的catch不会触发，因为translateText内部已经处理了降级
        // 但如果出现其他异常（如内存不足），仍会捕获
        results.push({
          text: text,           // 原文
          error: error.message, // 错误信息
          success: false        // 失败标记
        });
      }
    }
    
    // 返回所有翻译结果
    return results;
  }
}

// ==========================================
// 模块导出
// ==========================================
// 导出单例实例，确保整个应用中只有一个AI翻译模块实例
// 
// 使用方式：
// import aiTranslationModule from './src/ai/aiTranslation.js';
// const result = await aiTranslationModule.translateText('今天心情不好');
// 
// 单例模式的好处：
// 1. API Key只加载一次，节省资源
// 2. 本地模板只创建一次，节省内存
// 3. 状态共享，避免重复初始化

const aiTranslationModule = new AITranslationModule();
export default aiTranslationModule;
