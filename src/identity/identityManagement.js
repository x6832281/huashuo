/**
 * ============================================
 * 身份管理模块 (identityManagement.js)
 * ============================================
 * 
 * 功能说明：
 * 本模块负责管理用户的多个身份，允许用户创建、切换、归档和删除不同的身份。
 * 每个身份代表用户在应用中的一个角色或状态，例如"开心的我"、"忧郁的我"等。
 * 
 * 核心概念：
 * - 身份(Identity)：用户的一个角色，包含昵称和表情符号
 * - 活跃身份(Active Identity)：未被归档的身份，可以正常使用
 * - 归档身份(Archived Identity)：被标记为归档的身份，无法使用但保留数据
 * 
 * 业务规则：
 * 
 * 规则1：昵称长度限制
 * - 昵称必须在2-8个字符之间
 * - 中文字符按2个字符计算（因为中文在视觉和语义上通常更重）
 * - 例如："小明"（2个中文=4字符）符合要求，"A"（1字符）不符合
 * 
 * 规则2：归档后才能删除
 * - 身份必须先归档才能删除，不能直接删除活跃身份
 * - 这是数据保护机制，防止用户误删重要数据
 * - 归档后，用户确认不再需要时才能永久删除
 * 
 * 规则3：至少保留一个活跃身份
 * - 系统中必须至少有一个活跃身份
 * - 这是用户体验要求，避免用户没有任何可用身份
 * - 如果归档最后一个身份，系统会自动创建默认身份"我😊"
 * 
 * 规则4：Emoji表情符号验证
 * - 每个身份必须有一个有效的Emoji表情符号
 * - 使用正则表达式验证，支持常见的Unicode表情符号范围
 * - 包括：表情符号、符号、箭头、旗帜等
 * 
 * 数据存储：
 * - 使用localStorageModule进行本地存储（三级存储策略）
 * - 身份信息存储在'identities'存储对象中
 * - 当前身份ID单独存储在localStorage中（key: 'current_identity_id'）
 * 
 * 降级机制：
 * - 当前身份ID优先存储在localStorage，非浏览器环境使用内存变量
 * - 确保在任何环境下都能正确跟踪当前身份
 * 
 * 作者：话说APP开发团队
 * 创建日期：2024年
 * 最后更新：2026年4月
 */

import localStorageModule from '../storage/localStorage.js';

/**
 * 身份管理模块类
 * 实现了身份的完整生命周期管理：创建、读取、切换、更新、归档、删除
 */
class IdentityManagementModule {
  /**
   * 构造函数：初始化身份管理模块的配置参数
   * 设置当前身份追踪、默认身份值以及环境检测
   */
  constructor() {
    // 当前活跃身份的ID
    // 这个值会在用户切换身份时更新
    // 用于快速访问当前身份，无需每次都查询存储
    this.currentIdentityId = null;
    
    // 浏览器环境检测
    // 检测是否在浏览器中运行且支持IndexedDB
    // 用于决定使用localStorage还是内存变量存储当前身份ID
    this.isBrowser = typeof window !== 'undefined' && window.indexedDB;
    
    // 当前身份ID在localStorage中的存储键名
    // 这个键名用于在浏览器刷新后恢复当前身份
    this.currentIdentityKey = 'current_identity_id';
    
    // 默认身份的昵称
    // 当系统没有任何身份时，会自动创建这个默认身份
    // "我"是最简洁的默认昵称，表示用户自己
    this.defaultNickname = '我';
    
    // 默认身份的表情符号
    // 微笑表情😊表示友好和积极，适合作为默认表情
    this.defaultEmoji = '😊';
  }

  /**
   * 生成唯一ID
   * 使用时间戳+随机数的方式生成唯一标识符
   * 
   * 生成算法：
   * 1. 获取当前时间戳（毫秒），转换为36进制字符串
   * 2. 生成一个随机数，转换为36进制字符串，取第2位开始的子串
   * 3. 将两部分拼接，形成唯一ID
   * 
   * 例如：'ljx123abc' + 'xyz789' = 'ljx123abcxyz789'
   * 
   * 为什么使用36进制？
   * - 36进制包含数字0-9和字母a-z，生成的ID更短
   * - 比10进制（纯数字）节省约30%的长度
   * - 比16进制（0-9a-f）更短，但保持可读性
   * 
   * @returns {string} 返回生成的唯一ID字符串
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 验证昵称的合法性
   * 这是业务规则1的实现：昵称必须在2-8个字符之间
   * 
   * 验证逻辑：
   * 1. 检查昵称是否为空或不是字符串
   * 2. 去除首尾空格
   * 3. 将中文字符替换为'xx'（每个中文算2个字符）
   * 4. 检查替换后的长度是否在2-8之间
   * 
   * 中文字符计算规则：
   * - 正则表达式 /[\u4e00-\u9fa5]/g 匹配所有常用汉字
   * - 每个汉字替换为'xx'（2个字符）
   * - 例如："小明" -> "xxxx"（长度4），"John" -> "John"（长度4）
   * 
   * 为什么中文字符按2个字符计算？
   * - 中文在视觉上比英文字母更宽
   * - 中文的语义通常更丰富，一个字可以表达多个字母的含义
   * - 为了公平对待不同语言的昵称长度，中文字符权重更高
   * 
   * @param {string} nickname - 要验证的昵称
   * @returns {string} 返回去除空格后的合法昵称
   * @throws {Error} 如果昵称为空或长度不在2-8之间，抛出错误
   */
  validateNickname(nickname) {
    // 检查昵称是否为空或不是字符串类型
    if (!nickname || typeof nickname !== 'string') {
      throw new Error('昵称不能为空');
    }
    
    // 去除首尾空格
    // 防止用户输入 "  小明  " 这样的昵称
    const trimmedNickname = nickname.trim();
    
    // 计算昵称长度，中文字符按2个字符计算
    // 使用正则表达式将所有汉字替换为'xx'
    // \u4e00-\u9fa5 是常用汉字的Unicode范围
    const length = trimmedNickname.replace(/[\u4e00-\u9fa5]/g, 'xx').length;
    
    // 检查长度是否在2-8之间
    if (length < 2 || length > 8) {
      throw new Error('昵称长度必须在2-8个字符之间（中文按2个字符计算）');
    }
    
    // 返回验证通过后的昵称（已去除空格）
    return trimmedNickname;
  }

  /**
   * 验证Emoji表情符号的合法性
   * 这是业务规则4的实现：每个身份必须有一个有效的Emoji
   * 
   * 验证逻辑：
   * 1. 检查emoji是否为空或不是字符串
   * 2. 使用正则表达式测试是否为有效的Unicode表情符号
   * 
   * 支持的表情符号范围：
   * - \u{1F300}-\u{1F9FF}: 杂项符号和象形文字（包括天气、动物、食物等）
   * - \u{2600}-\u{26FF}: 杂项符号（包括太阳、月亮、星星等）
   * - \u{2700}-\u{27BF}: 装饰符号（包括心形、剪刀、笔记等）
   * - \u{1F600}-\u{1F64F}: 表情符号（包括各种面部表情）
   * - \u{1F680}-\u{1F6FF}: 交通和地图符号（包括汽车、飞机、火箭等）
   * - \u{1F1E0}-\u{1F1FF}: 区域指示符号（用于国旗emoji）
   * 
   * 正则表达式说明：
   * - /u 标志启用Unicode模式，支持4字节的表情符号
   * - | 表示"或"关系，匹配任意一个范围内的字符
   * 
   * @param {string} emoji - 要验证的表情符号
   * @returns {string} 返回验证通过的emoji
   * @throws {Error} 如果emoji为空或不是有效的表情符号，抛出错误
   */
  validateEmoji(emoji) {
    // 检查emoji是否为空或不是字符串类型
    if (!emoji || typeof emoji !== 'string') {
      throw new Error('Emoji不能为空');
    }
    
    // 正则表达式匹配有效的Unicode表情符号
    // 包括表情符号、符号、箭头、旗帜等多个Unicode区块
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u;
    
    // 测试emoji是否匹配正则表达式
    if (!emojiRegex.test(emoji)) {
      throw new Error('请选择一个有效的Emoji表情');
    }
    
    // 返回验证通过的emoji
    return emoji;
  }

  /**
   * 创建新身份
   * 验证昵称和emoji后，生成唯一ID并创建身份对象，保存到本地存储
   * 
   * 创建流程：
   * 1. 验证昵称的合法性（业务规则1）
   * 2. 验证emoji的合法性（业务规则4）
   * 3. 生成唯一ID
   * 4. 创建身份对象，包含id、昵称、emoji、创建时间
   * 5. 保存到本地存储的'identities'存储对象中
   * 6. 返回创建的身份对象
   * 
   * 身份对象结构：
   * {
   *   id: '唯一ID',
   *   nickname: '昵称',
   *   emoji: '表情符号',
   *   created_at: 1234567890,  // 创建时间戳（毫秒）
   *   archived_at: null        // 归档时间戳，null表示未归档
   * }
   * 
   * @param {string} nickname - 身份的昵称
   * @param {string} emoji - 身份的表情符号
   * @returns {Promise<Object>} 返回创建的身份对象
   * @throws {Error} 如果昵称或emoji验证失败，抛出错误
   */
  async createIdentity(nickname, emoji) {
    // 验证昵称的合法性（长度、格式等）
    const validatedNickname = this.validateNickname(nickname);
    
    // 验证emoji的合法性（是否为有效的Unicode表情符号）
    const validatedEmoji = this.validateEmoji(emoji);
    
    // 生成唯一ID
    const id = this.generateId();
    
    // 创建身份对象
    const identity = {
      id: id,                          // 唯一标识符
      nickname: validatedNickname,     // 验证后的昵称
      emoji: validatedEmoji,           // 验证后的表情符号
      created_at: Date.now(),          // 创建时间（当前时间戳）
      archived_at: null                // 归档时间，null表示未归档
    };
    
    // 保存到本地存储的'identities'存储对象
    // 使用localStorageModule的saveData方法，支持三级存储策略
    await localStorageModule.saveData('identities', identity);
    
    // 返回创建的身份对象
    return identity;
  }

  /**
   * 获取指定身份的详细信息
   * 根据身份ID从本地存储中读取身份对象
   * 
   * 获取流程：
   * 1. 验证身份ID的合法性（不能为空，必须是字符串）
   * 2. 从本地存储中读取身份对象
   * 3. 如果身份不存在，抛出错误
   * 4. 返回身份对象
   * 
   * @param {string} identityId - 要获取的身份ID
   * @returns {Promise<Object>} 返回身份对象
   * @throws {Error} 如果身份ID无效或身份不存在，抛出错误
   */
  async getIdentity(identityId) {
    // 验证身份ID的合法性
    // ID不能为空，必须是字符串类型
    if (!identityId || typeof identityId !== 'string') {
      throw new Error('身份ID无效');
    }
    
    // 从本地存储中读取身份对象
    // 使用localStorageModule的getData方法，支持三级存储策略
    const identity = await localStorageModule.getData('identities', identityId);
    
    // 检查身份是否存在
    if (!identity) {
      throw new Error('身份不存在');
    }
    
    // 返回身份对象
    return identity;
  }

  /**
   * 切换到指定身份
   * 将指定身份设置为当前活跃身份，并保存切换状态
   * 
   * 切换流程：
   * 1. 获取身份对象（验证身份是否存在）
   * 2. 检查身份是否已归档（已归档的身份不能切换）
   * 3. 更新当前身份ID
   * 4. 保存切换状态到localStorage（或内存变量）
   * 5. 返回身份对象
   * 
   * 状态保存策略：
   * - 浏览器环境：使用localStorage保存，刷新页面后仍然有效
   * - 非浏览器环境：使用内存变量_this.currentIdentityIdMemory保存
   * 
   * 为什么已归档的身份不能切换？
   * - 归档意味着这个身份已经不再使用
   * - 允许切换到归档身份会导致数据混乱
   * - 用户应该使用活跃身份进行新的心事发布
   * 
   * @param {string} identityId - 要切换到的身份ID
   * @returns {Promise<Object>} 返回切换后的身份对象
   * @throws {Error} 如果身份已归档或不存在，抛出错误
   */
  async switchIdentity(identityId) {
    // 获取身份对象（如果不存在会抛出错误）
    const identity = await this.getIdentity(identityId);
    
    // 检查身份是否已归档
    // 已归档的身份不能切换，这是业务规则
    if (identity.archived_at) {
      throw new Error('无法切换到已归档的身份');
    }
    
    // 更新当前身份ID
    this.currentIdentityId = identityId;
    
    // 保存切换状态
    if (this.isBrowser) {
      // 浏览器环境：使用localStorage保存
      // 这样刷新页面后仍然能记住当前身份
      localStorage.setItem(this.currentIdentityKey, identityId);
    } else {
      // 非浏览器环境：使用内存变量保存
      // 应用重启后会丢失，但测试环境足够使用
      this._currentIdentityIdMemory = identityId;
    }
    
    // 返回切换后的身份对象
    return identity;
  }

  /**
   * 获取当前活跃身份
   * 这是一个智能获取方法，会尝试多种方式获取当前身份
   * 
   * 获取优先级：
   * 1. 内存中的当前身份ID（this.currentIdentityId）
   * 2. localStorage中保存的身份ID（浏览器环境）
   * 3. 内存变量中保存的身份ID（非浏览器环境）
   * 4. 获取第一个活跃身份
   * 5. 如果没有活跃身份，创建默认身份"我😊"
   * 
   * 降级策略：
   * - 如果内存中的ID对应的身份不存在，清除该ID并尝试下一层级
   * - 如果localStorage中的ID对应的身份不存在，清除该ID并尝试下一层级
   * - 如果没有任何身份，自动创建默认身份
   * 
   * 这个方法的智能性体现在：
   * - 自动恢复刷新前的身份状态
   * - 自动清理无效的ID引用
   * - 自动创建默认身份，确保用户始终有可用身份
   * 
   * @returns {Promise<Object>} 返回当前活跃身份对象
   */
  async getCurrentIdentity() {
    // 优先级1：尝试使用内存中的当前身份ID
    if (this.currentIdentityId) {
      try {
        // 尝试获取该身份
        return await this.getIdentity(this.currentIdentityId);
      } catch (error) {
        // 如果身份不存在（可能被删除），清除ID并继续尝试下一层级
        this.currentIdentityId = null;
      }
    }
    
    // 优先级2：尝试从localStorage恢复身份ID（浏览器环境）
    if (this.isBrowser) {
      // 从localStorage读取保存的身份ID
      const storedId = localStorage.getItem(this.currentIdentityKey);
      if (storedId) {
        try {
          // 尝试获取该身份
          const identity = await this.getIdentity(storedId);
          // 成功获取，更新内存中的ID
          this.currentIdentityId = storedId;
          return identity;
        } catch (error) {
          // 身份不存在，清除localStorage中的ID
          localStorage.removeItem(this.currentIdentityKey);
        }
      }
    } else if (this._currentIdentityIdMemory) {
      // 优先级3：尝试从内存变量恢复身份ID（非浏览器环境）
      try {
        const identity = await this.getIdentity(this._currentIdentityIdMemory);
        // 成功获取，更新内存中的ID
        this.currentIdentityId = this._currentIdentityIdMemory;
        return identity;
      } catch (error) {
        // 身份不存在，清除内存变量
        this._currentIdentityIdMemory = null;
      }
    }
    
    // 优先级4：获取第一个活跃身份
    // 获取所有身份（包括已归档的）
    const identities = await this.getIdentityList({ activeOnly: false });
    if (identities.length > 0) {
      // 过滤出活跃身份
      const activeIdentities = identities.filter(i => !i.archived_at);
      if (activeIdentities.length > 0) {
        // 切换到第一个活跃身份
        const identity = activeIdentities[0];
        await this.switchIdentity(identity.id);
        return identity;
      }
    }
    
    // 优先级5：创建默认身份
    // 如果没有任何身份，创建默认身份"我😊"
    const defaultIdentity = await this.createIdentity(this.defaultNickname, this.defaultEmoji);
    // 切换到默认身份
    await this.switchIdentity(defaultIdentity.id);
    return defaultIdentity;
  }

  /**
   * 获取身份列表
   * 从本地存储中读取所有身份，按创建时间倒序排列
   * 
   * 排序规则：
   * - 按created_at时间戳倒序排列（最新的在前）
   * - 这样用户可以快速找到最近创建的身份
   * 
   * 过滤选项：
   * - activeOnly: true（默认）- 只返回活跃身份
   * - activeOnly: false - 返回所有身份（包括已归档的）
   * 
   * 使用场景：
   * - 身份选择器显示：调用getIdentityList()获取活跃身份
   * - 身份管理页面：调用getIdentityList({ activeOnly: false })获取所有身份
   * - 归档操作前检查：调用getIdentityList({ activeOnly: true })检查活跃身份数量
   * 
   * @param {Object} options - 可选参数
   * @param {boolean} options.activeOnly - 是否只返回活跃身份，默认为true
   * @returns {Promise<Array>} 返回身份对象数组
   */
  async getIdentityList(options = {}) {
    // 解构参数，设置activeOnly默认值为true
    const { activeOnly = true } = options;
    
    // 从本地存储中获取所有身份
    const identities = await localStorageModule.getAllData('identities');
    
    // 按创建时间倒序排列（最新的在前）
    // b.created_at - a.created_at 实现降序排序
    const sortedIdentities = identities.sort((a, b) => b.created_at - a.created_at);
    
    // 根据activeOnly参数过滤
    if (activeOnly) {
      // 只返回未归档的身份
      return sortedIdentities.filter(i => !i.archived_at);
    }
    
    // 返回所有身份（包括已归档的）
    return sortedIdentities;
  }

  /**
   * 归档指定身份
   * 将身份标记为归档状态，设置归档时间戳
   * 这是业务规则2和3的实现：归档后才能删除，至少保留一个活跃身份
   * 
   * 归档流程：
   * 1. 获取身份对象（验证身份是否存在）
   * 2. 检查身份是否已归档
   * 3. 检查归档后是否至少保留一个活跃身份（业务规则3）
   * 4. 更新身份对象，设置archived_at为当前时间
   * 5. 保存到本地存储
   * 6. 如果归档的是当前身份，自动切换到其他活跃身份
   * 7. 返回更新后的身份对象
   * 
   * 业务规则3的详细实现：
   * - 获取所有活跃身份
   * - 如果只有一个活跃身份，且就是要归档的那个
   * - 则抛出错误，不允许归档
   * - 这确保系统中始终至少有一个活跃身份
   * 
   * 当前身份切换逻辑：
   * - 如果归档的身份正好是当前正在使用的身份
   * - 系统会自动切换到另一个活跃身份
   * - 如果没有其他活跃身份，会创建默认身份"我😊"
   * - 这确保用户始终有一个可用的当前身份
   * 
   * @param {string} identityId - 要归档的身份ID
   * @returns {Promise<Object>} 返回归档后的身份对象
   * @throws {Error} 如果身份已归档或这是最后一个活跃身份，抛出错误
   */
  async archiveIdentity(identityId) {
    // 获取身份对象（如果不存在会抛出错误）
    const identity = await this.getIdentity(identityId);
    
    // 检查身份是否已归档
    if (identity.archived_at) {
      throw new Error('该身份已经归档');
    }
    
    // 检查归档后是否至少保留一个活跃身份（业务规则3）
    // 获取所有活跃身份
    const activeIdentities = await this.getIdentityList({ activeOnly: true });
    
    // 如果只有一个活跃身份，且就是要归档的那个
    // 则不允许归档，必须至少保留一个活跃身份
    if (activeIdentities.length === 1 && activeIdentities[0].id === identityId) {
      throw new Error('至少需要保留一个活跃身份');
    }
    
    // 更新身份对象，设置归档时间戳
    const updatedIdentity = {
      ...identity,                    // 保留原有所有字段
      archived_at: Date.now()         // 设置归档时间为当前时间戳
    };
    
    // 保存到本地存储
    await localStorageModule.saveData('identities', updatedIdentity);
    
    // 如果归档的身份正好是当前正在使用的身份
    // 需要自动切换到其他活跃身份
    if (this.currentIdentityId === identityId) {
      // 过滤出其他活跃身份
      const remainingActiveIdentities = activeIdentities.filter(i => i.id !== identityId);
      
      if (remainingActiveIdentities.length > 0) {
        // 有其他活跃身份，切换到第一个
        await this.switchIdentity(remainingActiveIdentities[0].id);
      } else {
        // 没有其他活跃身份（理论上不应该发生，因为前面已经检查过）
        // 创建默认身份并切换
        const newDefault = await this.createIdentity(this.defaultNickname, this.defaultEmoji);
        await this.switchIdentity(newDefault.id);
      }
    }
    
    // 返回归档后的身份对象
    return updatedIdentity;
  }

  /**
   * 删除指定身份
   * 从本地存储中永久删除身份对象
   * 这是业务规则2的实现：只能删除已归档的身份
   * 
   * 删除流程：
   * 1. 获取身份对象（验证身份是否存在）
   * 2. 检查身份是否已归档（业务规则2）
   * 3. 从本地存储中删除身份
   * 4. 如果删除的是当前身份，清除当前身份引用
   * 5. 如果有其他活跃身份，自动切换到第一个
   * 6. 返回true表示删除成功
   * 
   * 业务规则2的详细实现：
   * - 检查身份的archived_at字段
   * - 如果为null，表示未归档，不允许删除
   * - 如果不为null，表示已归档，允许删除
   * - 这确保用户不会误删还在使用的身份
   * 
   * 当前身份清理逻辑：
   * - 如果删除的身份正好是当前身份
   * - 清除当前身份ID（内存和localStorage）
   * - 如果有其他活跃身份，自动切换到第一个
   * - 这确保不会引用已删除的身份
   * 
   * @param {string} identityId - 要删除的身份ID
   * @returns {Promise<boolean>} 删除成功返回true
   * @throws {Error} 如果身份未归档或不存在，抛出错误
   */
  async deleteIdentity(identityId) {
    // 获取身份对象（如果不存在会抛出错误）
    const identity = await this.getIdentity(identityId);
    
    // 检查身份是否已归档（业务规则2）
    // 只能删除已归档的身份，防止误删
    if (!identity.archived_at) {
      throw new Error('只能删除已归档的身份');
    }
    
    // 从本地存储中永久删除身份
    await localStorageModule.deleteData('identities', identityId);
    
    // 如果删除的身份正好是当前正在使用的身份
    // 需要清除当前身份引用并切换到其他身份
    if (this.currentIdentityId === identityId) {
      // 清除当前身份ID
      this.currentIdentityId = null;
      
      // 清除localStorage中的保存
      if (this.isBrowser) {
        localStorage.removeItem(this.currentIdentityKey);
      } else {
        // 清除非浏览器环境的内存变量
        this._currentIdentityIdMemory = null;
      }
      
      // 获取剩余的活跃身份
      const remainingIdentities = await this.getIdentityList({ activeOnly: true });
      
      // 如果有其他活跃身份，切换到第一个
      if (remainingIdentities.length > 0) {
        await this.switchIdentity(remainingIdentities[0].id);
      }
      // 如果没有活跃身份（理论上不应该发生），用户下次调用getCurrentIdentity()时会自动创建
    }
    
    // 返回删除成功
    return true;
  }

  /**
   * 更新指定身份的信息
   * 支持更新昵称和/或表情符号
   * 
   * 更新流程：
   * 1. 获取身份对象（验证身份是否存在）
   * 2. 检查身份是否已归档（已归档的身份不能修改）
   * 3. 验证要更新的字段（昵称、emoji）
   * 4. 合并原有数据和更新数据
   * 5. 保存到本地存储
   * 6. 返回更新后的身份对象
   * 
   * 支持更新的字段：
   * - nickname: 身份昵称（会验证长度限制）
   * - emoji: 身份表情符号（会验证是否为有效emoji）
   * 
   * 验证策略：
   * - 只验证提供的字段，不验证未提供的字段
   * - 例如：只更新nickname时，不会验证emoji
   * - 使用validatedUpdates对象收集验证后的字段
   * 
   * 为什么已归档的身份不能修改？
   * - 归档意味着身份已经不再使用
   * - 修改归档身份没有实际意义
   * - 保持归档身份的原始状态，便于历史记录查看
   * 
   * @param {string} identityId - 要更新的身份ID
   * @param {Object} updates - 要更新的字段对象
   * @param {string} [updates.nickname] - 新的昵称（可选）
   * @param {string} [updates.emoji] - 新的表情符号（可选）
   * @returns {Promise<Object>} 返回更新后的身份对象
   * @throws {Error} 如果身份已归档、不存在或更新字段验证失败，抛出错误
   */
  async updateIdentity(identityId, updates) {
    // 获取身份对象（如果不存在会抛出错误）
    const identity = await this.getIdentity(identityId);
    
    // 检查身份是否已归档
    // 已归档的身份不能修改，保持历史状态
    if (identity.archived_at) {
      throw new Error('无法修改已归档的身份');
    }
    
    // 收集验证后的更新字段
    // 只验证提供的字段，不验证未提供的字段
    const validatedUpdates = {};
    
    // 如果要更新昵称，验证昵称的合法性
    if (updates.nickname !== undefined) {
      validatedUpdates.nickname = this.validateNickname(updates.nickname);
    }
    
    // 如果要更新emoji，验证emoji的合法性
    if (updates.emoji !== undefined) {
      validatedUpdates.emoji = this.validateEmoji(updates.emoji);
    }
    
    // 合并原有数据和验证后的更新数据
    // 使用对象展开运算符，更新字段会覆盖原有字段
    const updatedIdentity = {
      ...identity,              // 保留原有所有字段
      ...validatedUpdates       // 应用验证后的更新字段
    };
    
    // 保存到本地存储
    await localStorageModule.saveData('identities', updatedIdentity);
    
    // 返回更新后的身份对象
    return updatedIdentity;
  }
}

// ==========================================
// 模块导出
// ==========================================
// 导出单例实例，确保整个应用中只有一个身份管理实例
// 这样可以避免多个实例导致的身份状态不一致问题
// 
// 使用方式：
// import identityManagementModule from './src/identity/identityManagement.js';
// const identity = await identityManagementModule.createIdentity('小明', '😊');
// await identityManagementModule.switchIdentity(identity.id);
// 
// 单例模式的好处：
// 1. 状态共享：currentIdentityId在所有代码中保持一致
// 2. 避免冲突：不会创建多个不同的当前身份
// 3. 内存优化：只创建一个实例，节省资源

const identityManagementModule = new IdentityManagementModule();
export default identityManagementModule;
