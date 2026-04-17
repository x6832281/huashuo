/**
 * ============================================
 * 情绪树洞模块 (emotionTreeHole.js)
 * ============================================
 * 
 * 功能说明：
 * 本模块是应用的核心功能之一，负责管理用户发布的心事帖子。
 * 用户可以在这里倾诉心事，系统会自动分析情绪并分类到不同的情绪频段。
 * 
 * 情绪频段（Mood Band）：
 * - 频段0（🌧️）：低落/焦虑/疲惫 - 负面情绪
 * - 频段1（🌤️）：平静/波动/复杂 - 中性情绪
 * - 频段2（☀️）：轻松/积极/被接住 - 正面情绪
 * 
 * 业务规则：
 * 
 * 规则1：内容长度限制
 * - 心事内容必须在1-1000个字符之间
 * - 不能为空，也不能超过1000字
 * - 这是为了保证内容质量和可读性
 * 
 * 规则2：情绪频段编辑次数限制
 * - 每个帖子的情绪频段只能编辑一次
 * - AI会自动分析初始情绪频段（mood_band_ai）
 * - 用户可以手动调整一次（mood_band_final）
 * - 编辑次数记录在mood_band_edit_count字段中
 * 
 * 规则3：敏感信息检测
 * - 系统会自动检测心事内容中的敏感信息
 * - 包括：手机号、邮箱、身份证号、地址等
 * - 检测结果返回给用户，提醒用户注意隐私保护
 * - 但不会阻止用户发布，只是提醒
 * 
 * 规则4：身份隔离
 * - 每个身份只能看到自己发布的心事
 * - 不能查看其他身份的心事
 * - 确保不同身份之间的隐私隔离
 * 
 * 规则5：软删除机制
 * - 删除帖子时使用软删除（标记deleted_at时间戳）
 * - 不会从数据库中物理删除
 * - 归档的帖子可以恢复，但删除的帖子不能恢复
 * 
 * 数据存储：
 * - 使用localStorageModule进行本地存储（三级存储策略）
 * - 帖子信息存储在'posts'存储对象中
 * - 每个帖子关联一个身份ID（identity_id）
 * 
 * AI情绪分析：
 * - 使用关键词匹配进行情绪分析
 * - 负面情绪词数量 > 正面情绪词数量 => 频段0
 * - 正面情绪词数量 > 负面情绪词数量 => 频段2
 * - 情绪词数量相等 => 频段1
 * - 如果分析失败，默认返回频段1（平静/波动/复杂）
 * 
 * 作者：话说APP开发团队
 * 创建日期：2024年
 * 最后更新：2026年4月
 */

import localStorageModule from '../storage/localStorage.js';
import identityManagementModule from '../identity/identityManagement.js';

/**
 * 情绪树洞模块类
 * 实现了心事帖子的完整生命周期管理：创建、读取、编辑、归档、删除、恢复
 */
class EmotionTreeHoleModule {
  /**
   * 构造函数：初始化情绪频段定义
   * 情绪频段用于对心事进行情绪分类，帮助用户更好地理解自己的情绪状态
   */
  constructor() {
    // 定义三个情绪频段
    // value: 频段的数值标识（0、1、2）
    // label: 频段的显示标签，包含表情符号和描述文字
    this.moodBands = [
      { value: 0, label: '🌧️ 低落/焦虑/疲惫' },    // 负面情绪频段
      { value: 1, label: '🌤️ 平静/波动/复杂' },    // 中性情绪频段
      { value: 2, label: '☀️ 轻松/积极/被接住' }   // 正面情绪频段
    ];
  }

  /**
   * 生成唯一ID
   * 使用时间戳+随机数的方式生成唯一标识符
   * 用于生成帖子的唯一ID
   * 
   * 生成算法：
   * 1. 获取当前时间戳（毫秒），转换为36进制字符串
   * 2. 生成一个随机数，转换为36进制字符串，取第2位开始的子串
   * 3. 将两部分拼接，形成唯一ID
   * 
   * @returns {string} 返回生成的唯一ID字符串
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 验证心事内容的合法性
   * 这是业务规则1的实现：内容长度必须在1-1000个字符之间
   * 
   * 验证逻辑：
   * 1. 检查内容是否为空或不是字符串
   * 2. 去除首尾空格
   * 3. 检查去除空格后的内容是否为空
   * 4. 检查内容长度是否超过1000字
   * 
   * 为什么限制1000字？
   * - 保证内容的可读性，过长的内容不易阅读
   * - 避免用户一次性倾述太多，影响情绪健康
   * - 控制存储空间使用，优化性能
   * 
   * @param {string} contentText - 要验证的心事内容
   * @returns {string} 返回去除空格后的合法内容
   * @throws {Error} 如果内容为空或长度超过1000字，抛出错误
   */
  validateContent(contentText) {
    // 检查内容是否为空或不是字符串类型
    if (!contentText || typeof contentText !== 'string') {
      throw new Error('心事内容不能为空');
    }
    
    // 去除首尾空格
    // 防止用户输入 "  今天心情不好  " 这样的内容
    const trimmedContent = contentText.trim();
    
    // 检查去除空格后的内容是否为空
    // 防止用户只输入空格
    if (trimmedContent.length === 0) {
      throw new Error('心事内容不能为空');
    }
    
    // 检查内容长度是否超过1000字
    if (trimmedContent.length > 1000) {
      throw new Error('心事内容长度不能超过1000字');
    }
    
    // 返回验证通过后的内容（已去除空格）
    return trimmedContent;
  }

  /**
   * 检测心事内容中的敏感信息
   * 这是业务规则3的实现：自动检测并提醒用户注意隐私保护
   * 
   * 检测的敏感信息类型：
   * 1. 手机号（phone）：中国大陆手机号码（1开头，第二位3-9，共11位）
   * 2. 邮箱（email）：标准电子邮件格式（xxx@xxx.xxx）
   * 3. 身份证号（idCard）：中国大陆身份证号码（18位，前6位地区，中间8位生日，后4位序号）
   * 4. 地址（address）：包含常见地址关键词（市县区镇村街道路巷号栋单元层室）
   * 
   * 正则表达式说明：
   * - phone: /1[3-9]\d{9}/g - 匹配1开头，第二位3-9，后面9位数字
   * - email: /\b[\w.-]+@[\w.-]+\.\w+\b/g - 匹配标准邮箱格式
   * - idCard: /[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g
   *   匹配18位身份证号，支持1800-2099年，1-12月，1-31日，最后一位支持X
   * - address: /[市县区镇村街道路巷号栋单元层室]/g - 匹配常见的地址关键词
   * 
   * 注意：这些检测只是提醒，不会阻止用户发布
   * 目的是保护用户隐私，避免在公开场合泄露个人信息
   * 
   * @param {string} text - 要检测的文本内容
   * @returns {Array} 返回检测到的敏感信息数组
   *   格式：[{ type: 'phone', matches: ['13800138000'] }, ...]
   */
  detectSensitiveInfo(text) {
    // 定义敏感信息的正则表达式模式
    const sensitivePatterns = {
      // 中国大陆手机号码：1开头，第二位3-9，后面9位数字
      phone: /1[3-9]\d{9}/g,
      
      // 标准电子邮件格式：用户名@域名.后缀
      email: /\b[\w.-]+@[\w.-]+\.\w+\b/g,
      
      // 中国大陆身份证号码：18位，前6位地区，中间8位生日（1800-2099年），后4位序号
      // 支持最后一位为X的情况
      idCard: /[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g,
      
      // 常见地址关键词：市县区镇村街道路巷号栋单元层室
      address: /[市县区镇村街道路巷号栋单元层室]/g
    };

    // 存储检测到的敏感信息
    const detected = [];
    
    // 遍历所有敏感信息模式，逐一检测
    for (const [type, pattern] of Object.entries(sensitivePatterns)) {
      // 在文本中查找匹配的模式
      const matches = text.match(pattern);
      
      // 如果找到匹配项，添加到结果数组
      if (matches && matches.length > 0) {
        detected.push({
          type: type,           // 敏感信息类型（phone、email等）
          matches: matches      // 匹配到的具体内容
        });
      }
    }

    // 返回检测到的所有敏感信息
    return detected;
  }

  /**
   * 分析心事内容的情绪频段
   * 使用关键词匹配的方式进行情绪分析
   * 
   * 分析算法：
   * 1. 将内容转换为小写（虽然中文不需要，但为了统一处理）
   * 2. 定义负面情绪词列表和正面情绪词列表
   * 3. 统计内容中包含的负面情绪词数量
   * 4. 统计内容中包含的正面情绪词数量
   * 5. 比较两个数量：
   *    - 负面词数量 > 正面词数量 => 频段0（低落/焦虑/疲惫）
   *    - 正面词数量 > 负面词数量 => 频段2（轻松/积极/被接住）
   *    - 情绪词数量相等 => 频段1（平静/波动/复杂）
   * 
   * 关键词列表说明：
   * - 负面情绪词：难过、伤心、悲伤、痛苦、焦虑、抑郁、疲惫、压力、失望、绝望、愤怒、害怕、担心、烦恼、委屈
   * - 正面情绪词：开心、快乐、高兴、喜悦、兴奋、幸福、满足、平静、轻松、温暖、感激、希望、期待、成功、美好
   * 
   * 为什么使用关键词匹配而不是AI模型？
   * - 关键词匹配速度快，不需要网络请求
   * - 本地运行，保护用户隐私
   * - 对于简单的情绪分类，关键词匹配已经足够准确
   * - 如果未来需要更准确的情绪分析，可以集成AI模型
   * 
   * 容错机制：
   * 如果分析过程中出现任何错误，默认返回频段1（平静/波动/复杂）
   * 这是最中性、最安全的默认值
   * 
   * @param {string} content - 要分析的心事内容
   * @returns {Promise<number>} 返回分析得到的情绪频段值（0、1或2）
   */
  async analyzeMoodBand(content) {
    try {
      // 将内容转换为小写（虽然中文不需要，但为了统一处理）
      const contentLower = content.toLowerCase();
      
      // 定义负面情绪词列表
      // 这些词汇表达负面情绪，如悲伤、焦虑、疲惫等
      const negativeKeywords = ['难过', '伤心', '悲伤', '痛苦', '焦虑', '抑郁', '疲惫', '压力', '失望', '绝望', '愤怒', '害怕', '担心', '烦恼', '委屈'];
      
      // 定义正面情绪词列表
      // 这些词汇表达正面情绪，如快乐、幸福、轻松等
      const positiveKeywords = ['开心', '快乐', '高兴', '喜悦', '兴奋', '幸福', '满足', '平静', '轻松', '温暖', '感激', '希望', '期待', '成功', '美好'];
      
      // 统计负面情绪词出现次数
      let negativeCount = 0;
      for (const keyword of negativeKeywords) {
        if (content.includes(keyword)) {
          negativeCount++;
        }
      }
      
      // 统计正面情绪词出现次数
      let positiveCount = 0;
      for (const keyword of positiveKeywords) {
        if (content.includes(keyword)) {
          positiveCount++;
        }
      }
      
      // 比较正面和负面情绪词数量，确定情绪频段
      if (negativeCount > positiveCount) {
        return 0; // 负面情绪更多，返回频段0（低落/焦虑/疲惫）
      } else if (positiveCount > negativeCount) {
        return 2; // 正面情绪更多，返回频段2（轻松/积极/被接住）
      } else {
        return 1; // 情绪词数量相等或都没有，返回频段1（平静/波动/复杂）
      }
    } catch (error) {
      // 情绪分析失败，返回默认的频段1
      // 频段1是最中性、最安全的默认值
      console.error('情绪分析失败:', error);
      return 1; // 默认返回平静/波动/复杂
    }
  }

  /**
   * 创建新的心事帖子
   * 验证内容后，分析情绪，创建帖子对象并保存到本地存储
   * 
   * 创建流程：
   * 1. 验证内容的合法性（业务规则1）
   * 2. 获取当前身份（确保帖子关联到正确的身份）
   * 3. 检测内容中的敏感信息（业务规则3）
   * 4. 分析内容的情绪频段
   * 5. 创建帖子对象，包含所有必要字段
   * 6. 保存到本地存储的'posts'存储对象中
   * 7. 返回帖子对象和敏感信息检测结果
   * 
   * 帖子对象结构：
   * {
   *   id: '唯一ID',
   *   identity_id: '身份ID',           // 关联的身份
   *   mood_band_ai: 0,                 // AI分析的情绪频段
   *   mood_band_final: 0,              // 最终的情绪频段（可能被用户编辑）
   *   mood_band_edit_count: 0,         // 情绪频段编辑次数（最多1次）
   *   content_text: '心事内容',        // 验证后的内容
   *   created_at: 1234567890,          // 创建时间戳（毫秒）
   *   archived_at: null,               // 归档时间戳，null表示未归档
   *   deleted_at: null                 // 删除时间戳，null表示未删除
   * }
   * 
   * 返回值说明：
   * 返回一个对象，包含post和sensitiveInfo两个字段
   * {
   *   post: {...},                    // 创建的帖子对象
   *   sensitiveInfo: [...]            // 检测到的敏感信息数组
   * }
   * 
   * 为什么返回敏感信息？
   * - 让前端可以提醒用户注意隐私保护
   * - 但不会阻止用户发布，只是提醒
   * 
   * @param {string} contentText - 心事内容
   * @returns {Promise<Object>} 返回包含帖子对象和敏感信息的对象
   * @throws {Error} 如果内容验证失败或获取当前身份失败，抛出错误
   */
  async createPost(contentText) {
    // 验证内容的合法性（长度、格式等）
    const validatedContent = this.validateContent(contentText);
    
    // 获取当前活跃身份
    // 确保帖子关联到正确的身份
    const currentIdentity = await identityManagementModule.getCurrentIdentity();
    
    // 检测内容中的敏感信息（手机号、邮箱、身份证号、地址等）
    const sensitiveInfo = this.detectSensitiveInfo(validatedContent);
    
    // 分析内容的情绪频段
    // 使用关键词匹配进行情绪分析
    const moodBandAi = await this.analyzeMoodBand(validatedContent);
    
    // 创建帖子对象
    const post = {
      id: this.generateId(),              // 生成唯一ID
      identity_id: currentIdentity.id,    // 关联当前身份的ID
      mood_band_ai: moodBandAi,           // AI分析的初始情绪频段
      mood_band_final: moodBandAi,        // 最终情绪频段（初始等于AI分析结果）
      mood_band_edit_count: 0,            // 情绪频段编辑次数（初始为0，最多1次）
      content_text: validatedContent,     // 验证后的心事内容
      created_at: Date.now(),             // 创建时间（当前时间戳）
      archived_at: null,                  // 归档时间，null表示未归档
      deleted_at: null                    // 删除时间，null表示未删除
    };
    
    // 保存到本地存储的'posts'存储对象
    // 使用localStorageModule的saveData方法，支持三级存储策略
    await localStorageModule.saveData('posts', post);
    
    // 返回帖子对象和敏感信息检测结果
    // 返回值被包装在对象中：{ post: {...}, sensitiveInfo: [...] }
    return {
      post,
      sensitiveInfo
    };
  }

  /**
   * 获取心事帖子列表
   * 根据过滤条件获取当前身份的心事帖子列表，按创建时间倒序排列
   * 
   * 过滤条件：
   * - identity_id: 只获取当前身份的帖子（强制过滤）
   * - deleted_at: 排除已删除的帖子（强制过滤）
   * - archived: 可选，过滤归档状态
   *   - undefined: 返回所有未删除的帖子（包括已归档和未归档）
   *   - true: 只返回已归档的帖子
   *   - false: 只返回未归档的帖子
   * - moodBand: 可选，过滤情绪频段
   *   - undefined: 返回所有情绪频段的帖子
   *   - 0: 只返回频段0的帖子
   *   - 1: 只返回频段1的帖子
   *   - 2: 只返回频段2的帖子
   * 
   * 排序规则：
   * - 按created_at时间戳倒序排列（最新的在前）
   * - 这样用户可以快速看到最近发布的心事
   * 
   * 业务规则4的实现（身份隔离）：
   * - 只返回当前身份（currentIdentity.id）的帖子
   * - 其他身份的帖子不会出现在列表中
   * - 确保不同身份之间的隐私隔离
   * 
   * 使用场景：
   * - 心事列表页面：调用getPostList()获取所有未删除的心事
   * - 归档心事页面：调用getPostList({ archived: true })获取已归档的心事
   * - 情绪频段页面：调用getPostList({ moodBand: 0 })获取特定情绪的心事
   * 
   * @param {Object} filters - 可选的过滤条件
   * @param {boolean} [filters.archived] - 归档状态过滤（undefined=全部，true=已归档，false=未归档）
   * @param {number} [filters.moodBand] - 情绪频段过滤（0、1或2）
   * @returns {Promise<Array>} 返回帖子对象数组
   */
  async getPostList(filters = {}) {
    // 获取当前活跃身份
    // 用于过滤只返回当前身份的心事（业务规则4：身份隔离）
    const currentIdentity = await identityManagementModule.getCurrentIdentity();
    
    // 从本地存储中获取所有帖子
    const allPosts = await localStorageModule.getAllData('posts');
    
    // 根据过滤条件筛选帖子
    let filteredPosts = allPosts.filter(post => {
      // 强制过滤：只返回当前身份的帖子
      if (post.identity_id !== currentIdentity.id) return false;
      
      // 强制过滤：排除已删除的帖子
      if (post.deleted_at) return false;
      
      // 可选过滤：归档状态
      if (filters.archived !== undefined) {
        // 如果要求已归档但帖子未归档，排除
        if (filters.archived && !post.archived_at) return false;
        // 如果要求未归档但帖子已归档，排除
        if (!filters.archived && post.archived_at) return false;
      }
      
      // 可选过滤：情绪频段
      if (filters.moodBand !== undefined) {
        // 如果情绪频段不匹配，排除
        if (post.mood_band_final !== filters.moodBand) return false;
      }
      
      // 通过所有过滤条件，保留该帖子
      return true;
    });
    
    // 按创建时间倒序排列（最新的在前）
    // b.created_at - a.created_at 实现降序排序
    filteredPosts.sort((a, b) => b.created_at - a.created_at);
    
    // 返回过滤后的帖子列表
    return filteredPosts;
  }

  /**
   * 获取指定心事的详细信息
   * 根据帖子ID从本地存储中读取帖子对象，并进行权限验证
   * 
   * 获取流程：
   * 1. 验证帖子ID的合法性（不能为空，必须是字符串）
   * 2. 从本地存储中读取帖子对象
   * 3. 检查帖子是否存在
   * 4. 检查帖子是否属于当前身份（业务规则4：身份隔离）
   * 5. 检查帖子是否已删除
   * 6. 返回帖子对象
   * 
   * 权限验证：
   * - 帖子必须属于当前身份
   * - 如果帖子属于其他身份，抛出"无权访问此心事"错误
   * - 这是业务规则4（身份隔离）的严格实现
   * 
   * 删除检查：
   * - 如果帖子已删除（deleted_at不为null），抛出"心事已删除"错误
   * - 已删除的帖子不能查看，保护用户隐私
   * 
   * @param {string} postId - 要获取的帖子ID
   * @returns {Promise<Object>} 返回帖子对象
   * @throws {Error} 如果帖子ID无效、帖子不存在、无权访问或帖子已删除，抛出错误
   */
  async getPostDetail(postId) {
    // 验证帖子ID的合法性
    // ID不能为空，必须是字符串类型
    if (!postId || typeof postId !== 'string') {
      throw new Error('心事ID无效');
    }
    
    // 从本地存储中读取帖子对象
    // 使用localStorageModule的getData方法，支持三级存储策略
    const post = await localStorageModule.getData('posts', postId);
    
    // 检查帖子是否存在
    if (!post) {
      throw new Error('心事不存在');
    }
    
    // 获取当前活跃身份
    // 用于验证帖子权限（业务规则4：身份隔离）
    const currentIdentity = await identityManagementModule.getCurrentIdentity();
    
    // 检查帖子是否属于当前身份
    // 如果不属于，抛出权限错误
    if (post.identity_id !== currentIdentity.id) {
      throw new Error('无权访问此心事');
    }
    
    // 检查帖子是否已删除
    // 已删除的帖子不能查看
    if (post.deleted_at) {
      throw new Error('心事已删除');
    }
    
    // 返回帖子对象
    return post;
  }

  /**
   * 编辑心事的情绪频段
   * 允许用户手动调整AI分析的情绪频段
   * 这是业务规则2的实现：情绪频段只能编辑一次
   * 
   * 编辑流程：
   * 1. 验证帖子ID的合法性
   * 2. 验证新的情绪频段值（必须是0、1或2）
   * 3. 获取帖子详情（进行权限验证）
   * 4. 检查编辑次数是否已达到上限（业务规则2）
   * 5. 更新帖子对象，设置新的情绪频段和编辑次数
   * 6. 保存到本地存储
   * 7. 返回更新后的帖子对象
   * 
   * 业务规则2的详细实现：
   * - 检查mood_band_edit_count字段
   * - 如果 >= 1，表示已经编辑过，不允许再次编辑
   * - 如果 < 1，表示未编辑过，允许编辑
   * - 编辑后，mood_band_edit_count增加1
   * 
   * 为什么限制只能编辑一次？
   * - 鼓励用户认真思考自己的情绪状态
   * - 避免频繁修改导致的情绪混乱
   * - AI的初始分析通常已经足够准确
   * - 给用户一次修正的机会，确保准确性
   * 
   * 情绪字段说明：
   * - mood_band_ai: AI分析的初始情绪频段（不会改变）
   * - mood_band_final: 最终的情绪频段（可能被用户编辑）
   * - mood_band_edit_count: 编辑次数（0表示未编辑，1表示已编辑）
   * 
   * @param {string} postId - 要编辑的帖子ID
   * @param {number} newMoodBand - 新的情绪频段值（0、1或2）
   * @returns {Promise<Object>} 返回更新后的帖子对象
   * @throws {Error} 如果帖子ID无效、情绪频段无效、编辑次数已达上限或无权访问，抛出错误
   */
  async editMoodBand(postId, newMoodBand) {
    // 验证帖子ID的合法性
    if (!postId || typeof postId !== 'string') {
      throw new Error('心事ID无效');
    }
    
    // 验证新的情绪频段值
    // 必须是0、1或2，其他值无效
    if (![0, 1, 2].includes(newMoodBand)) {
      throw new Error('情绪频段无效');
    }
    
    // 获取帖子详情（会进行权限验证）
    // 如果无权访问或帖子已删除，会抛出错误
    const post = await this.getPostDetail(postId);
    
    // 检查编辑次数是否已达到上限（业务规则2）
    // mood_band_edit_count >= 1 表示已经编辑过，不允许再次编辑
    if (post.mood_band_edit_count >= 1) {
      throw new Error('情绪频段只能修改一次');
    }
    
    // 创建更新后的帖子对象
    // 更新最终情绪频段和编辑次数
    const updatedPost = {
      ...post,                                  // 保留原有所有字段
      mood_band_final: newMoodBand,             // 设置新的最终情绪频段
      mood_band_edit_count: post.mood_band_edit_count + 1  // 编辑次数增加1
    };
    
    // 保存到本地存储
    await localStorageModule.saveData('posts', updatedPost);
    
    // 返回更新后的帖子对象
    return updatedPost;
  }

  /**
   * 归档指定的心事帖子
   * 将帖子标记为归档状态，设置归档时间戳
   * 
   * 归档流程：
   * 1. 获取帖子详情（进行权限验证）
   * 2. 检查帖子是否已归档
   * 3. 更新帖子对象，设置archived_at为当前时间
   * 4. 保存到本地存储
   * 5. 返回更新后的帖子对象
   * 
   * 归档的意义：
   * - 将不再活跃的心事移入归档状态
   * - 归档的心事不会出现在默认的心事列表中
   * - 但可以随时恢复（使用restorePost方法）
   * - 归档是一种"软隐藏"，不是删除
   * 
   * 归档 vs 删除：
   * - 归档：设置archived_at，可以恢复
   * - 删除：设置deleted_at，不可恢复
   * - 归档是温和的处理方式，删除是彻底的处理方式
   * 
   * @param {string} postId - 要归档的帖子ID
   * @returns {Promise<Object>} 返回归档后的帖子对象
   * @throws {Error} 如果帖子已归档或无权访问，抛出错误
   */
  async archivePost(postId) {
    // 获取帖子详情（会进行权限验证）
    // 如果无权访问或帖子已删除，会抛出错误
    const post = await this.getPostDetail(postId);
    
    // 检查帖子是否已归档
    // 已归档的帖子不能重复归档
    if (post.archived_at) {
      throw new Error('心事已经归档');
    }
    
    // 创建更新后的帖子对象
    // 设置归档时间为当前时间戳
    const updatedPost = {
      ...post,                    // 保留原有所有字段
      archived_at: Date.now()     // 设置归档时间为当前时间戳
    };
    
    // 保存到本地存储
    await localStorageModule.saveData('posts', updatedPost);
    
    // 返回归档后的帖子对象
    return updatedPost;
  }

  /**
   * 删除指定的心事帖子
   * 将帖子标记为删除状态，设置删除时间戳（软删除）
   * 
   * 删除流程：
   * 1. 获取帖子详情（进行权限验证）
   * 2. 检查帖子是否已删除
   * 3. 更新帖子对象，设置deleted_at为当前时间
   * 4. 保存到本地存储
   * 5. 返回更新后的帖子对象
   * 
   * 软删除机制（业务规则5）：
   * - 删除时不会从数据库中物理删除
   * - 只是设置deleted_at时间戳标记为删除
   * - 已删除的帖子不会出现在任何列表中
   * - 已删除的帖子不能查看（getPostDetail会抛出错误）
   * - 已删除的帖子不能恢复（与归档不同）
   * 
   * 为什么使用软删除？
   * - 保留数据完整性，便于审计和恢复
   * - 避免数据丢失导致的用户投诉
   * - 符合数据保护法规的要求
   * - 未来如果需要，可以实现数据恢复功能
   * 
   * 删除 vs 归档：
   * - 删除：设置deleted_at，不可恢复，更彻底
   * - 归档：设置archived_at，可以恢复，更温和
   * 
   * @param {string} postId - 要删除的帖子ID
   * @returns {Promise<Object>} 返回删除后的帖子对象
   * @throws {Error} 如果帖子已删除或无权访问，抛出错误
   */
  async deletePost(postId) {
    // 获取帖子详情（会进行权限验证）
    // 如果无权访问或帖子已删除，会抛出错误
    const post = await this.getPostDetail(postId);
    
    // 检查帖子是否已删除
    // 已删除的帖子不能重复删除
    if (post.deleted_at) {
      throw new Error('心事已经删除');
    }
    
    // 创建更新后的帖子对象
    // 设置删除时间为当前时间戳
    const updatedPost = {
      ...post,                  // 保留原有所有字段
      deleted_at: Date.now()    // 设置删除时间为当前时间戳
    };
    
    // 保存到本地存储
    await localStorageModule.saveData('posts', updatedPost);
    
    // 返回删除后的帖子对象
    return updatedPost;
  }

  /**
   * 恢复已归档的心事帖子
   * 将归档的帖子重新标记为活跃状态，清除归档时间戳
   * 
   * 恢复流程：
   * 1. 获取帖子详情（进行权限验证）
   * 2. 检查帖子是否已归档（只有归档的帖子才能恢复）
   * 3. 更新帖子对象，将archived_at设置为null
   * 4. 保存到本地存储
   * 5. 返回更新后的帖子对象
   * 
   * 恢复的限制：
   * - 只有归档的帖子才能恢复
   * - 删除的帖子不能恢复（deleted_at不为null）
   * - 这是恢复和删除的关键区别
   * 
   * 恢复的意义：
   * - 用户可能误归档了心事，需要恢复
   * - 归档是一种"软隐藏"，恢复就是取消隐藏
   * - 恢复后，心事会重新出现在默认的心事列表中
   * 
   * @param {string} postId - 要恢复的帖子ID
   * @returns {Promise<Object>} 返回恢复后的帖子对象
   * @throws {Error} 如果帖子未归档、已删除或无权访问，抛出错误
   */
  async restorePost(postId) {
    // 获取帖子详情（会进行权限验证）
    // 如果无权访问或帖子已删除，会抛出错误
    const post = await this.getPostDetail(postId);
    
    // 检查帖子是否已归档
    // 只有归档的帖子才能恢复
    // 未归档的帖子不需要恢复
    if (!post.archived_at) {
      throw new Error('心事未归档');
    }
    
    // 创建更新后的帖子对象
    // 清除归档时间戳，恢复为活跃状态
    const updatedPost = {
      ...post,                  // 保留原有所有字段
      archived_at: null         // 清除归档时间戳，恢复为活跃状态
    };
    
    // 保存到本地存储
    await localStorageModule.saveData('posts', updatedPost);
    
    // 返回恢复后的帖子对象
    return updatedPost;
  }

  /**
   * 获取心事帖子的数量
   * 根据过滤条件获取当前身份的心事帖子数量
   * 
   * 实现方式：
   * - 先调用getPostList()获取过滤后的帖子列表
   * - 然后返回列表的长度
   * 
   * 使用场景：
   * - 显示心事总数：调用getPostCount()
   * - 显示已归档心事数量：调用getPostCount({ archived: true })
   * - 显示特定情绪的心事数量：调用getPostCount({ moodBand: 0 })
   * 
   * @param {Object} filters - 可选的过滤条件（与getPostList相同）
   * @param {boolean} [filters.archived] - 归档状态过滤
   * @param {number} [filters.moodBand] - 情绪频段过滤
   * @returns {Promise<number>} 返回符合条件的帖子数量
   */
  async getPostCount(filters = {}) {
    // 获取过滤后的帖子列表
    const posts = await this.getPostList(filters);
    
    // 返回列表长度作为数量
    return posts.length;
  }
}

// ==========================================
// 模块导出
// ==========================================
// 导出单例实例，确保整个应用中只有一个情绪树洞模块实例
// 这样可以避免多个实例导致的数据不一致问题
// 
// 使用方式：
// import emotionTreeHoleModule from './src/emotion/emotionTreeHole.js';
// const { post, sensitiveInfo } = await emotionTreeHoleModule.createPost('今天心情不好');
// const posts = await emotionTreeHoleModule.getPostList();
// 
// 单例模式的好处：
// 1. 状态共享：moodBands配置在所有代码中保持一致
// 2. 避免冲突：不会创建多个不同的情绪分析实例
// 3. 内存优化：只创建一个实例，节省资源

const emotionTreeHoleModule = new EmotionTreeHoleModule();
export default emotionTreeHoleModule;
