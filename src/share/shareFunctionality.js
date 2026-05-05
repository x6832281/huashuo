/**
 * ============================================
 * 分享功能模块 (shareFunctionality.js)
 * ============================================
 * 
 * 功能说明：
 * 本模块负责提供多种分享方式，让用户可以将心情卡片分享出去。
 * 支持系统原生分享、图片保存、链接复制、文案复制等多种方式。
 * 
 * 分享方式：
 * 1. 系统分享：调用浏览器的Web Share API，调用系统分享面板（微信、QQ、微博等）
 * 2. 保存图片：将卡片图片下载到本地，用户可以手动发送
 * 3. 复制链接：将分享链接复制到剪贴板，用户可以粘贴到任何地方
 * 4. 复制文案：将AI生成的诗句复制到剪贴板，方便用户直接使用
 * 
 * 降级策略：
 * - 优先使用系统分享（Web Share API），体验最好
 * - 如果系统分享不可用，使用兜底方案（复制链接 + 复制文案）
 * - 剪贴板API不可用时，使用传统的textarea方法复制
 * - 确保在任何浏览器和环境下都能正常分享
 * 
 * 环境检测：
 * - 浏览器环境：支持所有分享方式
 * - 非浏览器环境（如Node.js）：不支持任何分享方式
 * - HTTPS环境：支持Clipboard API（现代浏览器要求安全上下文）
 * - HTTP环境：使用降级复制方法
 * 
 * 分享链接格式：
 * - https://huashuo.app/s/share_id
 * - 其他人可以通过链接查看卡片内容并给予拥抱反馈
 * 
 * 作者：话说APP开发团队
 * 创建日期：2024年
 * 最后更新：2026年4月
 */

import localStorageModule from '../storage/localStorage.js';

/**
 * 分享功能模块类
 * 实现了多种分享方式的完整实现，包括系统分享、图片保存、链接复制、文案复制
 */
class ShareFunctionalityModule {
  /**
   * 构造函数：初始化分享链接基础URL
   */
  constructor() {
    // 分享链接的基础URL
    // 完整的分享链接格式：https://huashuo.app/s/share_id
    this.baseUrl = 'https://huashuo.app/s';
  }

  /**
   * 通过系统分享（Web Share API）
   * 调用浏览器原生的分享功能，弹出系统分享面板
   * 
   * Web Share API说明：
   * - 现代浏览器提供的原生分享功能
   * - 可以调用系统分享面板（微信、QQ、微博等）
   * - 只在HTTPS环境下可用（安全要求）
   * - 移动端浏览器支持较好，桌面端支持较差
   * - 使用navigator.share()方法调用
   * 
   * 分享流程：
   * 1. 检查是否在浏览器环境中
   * 2. 检查浏览器是否支持Web Share API
   * 3. 调用navigator.share()分享卡片
   * 4. 记录分享操作到本地存储
   * 5. 返回分享结果（成功/失败）
   * 
   * @param {Object} cardData - 卡片数据对象
   * @param {string} cardData.ai_poem - AI生成的诗句（作为分享内容）
   * @param {string} cardData.share_id - 分享链接ID
   * @param {string} cardData.id - 卡片ID（用于记录分享操作）
   * @param {Blob} imageBlob - 导出的图片Blob对象
   * @returns {Promise<boolean>} 分享成功返回true，失败返回false
   */
  async shareViaSystem(cardData, imageBlob) {
    // 检查是否在浏览器环境中
    // 非浏览器环境（如Node.js）不支持Web Share API
    if (!this.isBrowser()) {
      console.warn('系统分享仅在浏览器环境中可用');
      return false;
    }
    
    // 检查浏览器是否支持Web Share API
    if (navigator.share) {
      try {
        // 调用Web Share API分享卡片
        // 这会弹出系统分享面板，用户可以选择分享目标（微信、QQ等）
        await navigator.share({
          title: '话说APP分享',    // 分享标题
          text: cardData.ai_poem,  // 分享内容（AI生成的诗句）
          url: this.generateShareLink(cardData.share_id)  // 分享链接
        });
        
        // 分享成功，记录分享操作
        // 用于统计分析和用户行为追踪
        this.recordShareAction(cardData.id, 'system');
        return true;
      } catch (error) {
        // 分享失败（用户取消、网络错误等）
        // 记录警告日志，返回false
        console.warn('系统分享失败:', error);
        return false;
      }
    } else {
      // 浏览器不支持Web Share API
      console.warn('Web Share API 不可用');
      return false;
    }
  }

  /**
   * 保存卡片图片到本地
   * 创建一个隐藏的下载链接，触发浏览器下载图片
   * 
   * 保存流程：
   * 1. 检查是否在浏览器环境中
   * 2. 使用URL.createObjectURL()创建图片的临时URL
   * 3. 创建一个隐藏的<a>标签，设置download属性
   * 4. 触发点击事件，开始下载
   * 5. 清理临时URL和<a>标签
   * 
   * 文件名格式：
   * - huashuo_card_时间戳.png
   * - 例如：huashuo_card_1234567890.png
   * 
   * URL.createObjectURL()说明：
   * - 将Blob对象转换为浏览器可以访问的URL
   * - 返回的URL格式：blob:https://...
   * - 使用URL.revokeObjectURL()释放内存
   * 
   * @param {Blob} imageBlob - 要保存的图片Blob对象
   * @returns {boolean} 保存成功返回true，失败返回false
   */
  saveImage(imageBlob) {
    // 检查是否在浏览器环境中
    if (!this.isBrowser()) {
      console.warn('图片保存仅在浏览器环境中可用');
      return false;
    }
    
    try {
      // 创建图片的临时URL
      // URL.createObjectURL()将Blob对象转换为浏览器可访问的URL
      const url = URL.createObjectURL(imageBlob);
      
      // 创建一个隐藏的<a>标签用于下载
      const link = document.createElement('a');
      link.href = url;  // 设置下载链接为图片URL
      // 设置下载文件名，使用时间戳确保唯一性
      link.download = `huashuo_card_${Date.now()}.png`;
      
      // 将<a>标签添加到页面（必须添加到DOM才能触发点击）
      document.body.appendChild(link);
      link.click();  // 触发点击事件，开始下载
      
      // 下载完成后清理
      document.body.removeChild(link);  // 移除<a>标签
      URL.revokeObjectURL(url);  // 释放临时URL，避免内存泄漏
      
      return true;
    } catch (error) {
      // 保存图片失败
      console.error('保存图片失败:', error);
      return false;
    }
  }

  /**
   * 复制分享链接到剪贴板
   * 将分享链接复制到系统剪贴板，用户可以粘贴到任何地方
   * 
   * 复制策略：
   * 1. 优先使用现代Clipboard API（navigator.clipboard.writeText）
   *    - 需要HTTPS安全上下文
   *    - 现代浏览器支持良好
   * 2. 如果Clipboard API不可用，使用降级方法
   *    - 创建隐藏的textarea元素
   *    - 选中文本并执行document.execCommand('copy')
   *    - 适用于旧版浏览器和HTTP环境
   * 
   * 安全上下文说明：
   * - window.isSecureContext 表示当前页面是HTTPS或localhost
   * - Clipboard API只在安全上下文中可用
   * - 这是为了防止恶意网站读取用户剪贴板
   * 
   * @param {string} shareId - 分享链接ID
   * @returns {Promise<boolean>} 复制成功返回true，失败返回false
   */
  async copyShareLink(shareId) {
    // 检查是否在浏览器环境中
    if (!this.isBrowser()) {
      console.warn('复制功能仅在浏览器环境中可用');
      return false;
    }
    
    // 生成完整的分享链接
    const shareLink = this.generateShareLink(shareId);
    
    try {
      // 检查是否支持现代Clipboard API
      // navigator.clipboard.writeText 是异步的，返回Promise
      // window.isSecureContext 确保是HTTPS环境
      if (navigator.clipboard && window.isSecureContext) {
        // 使用现代Clipboard API复制
        await navigator.clipboard.writeText(shareLink);
        return true;
      } else {
        // Clipboard API不可用，使用降级方法
        return this.fallbackCopyTextToClipboard(shareLink);
      }
    } catch (error) {
      // 复制链接失败
      console.error('复制链接失败:', error);
      return false;
    }
  }

  /**
   * 复制任意文本到剪贴板
   * 与copyShareLink类似，但可以复制任意文本内容
   * 常用于复制AI生成的诗句、表情包文案等
   * 
   * @param {string} text - 要复制的文本内容
   * @returns {Promise<boolean>} 复制成功返回true，失败返回false
   */
  async copyText(text) {
    // 检查是否在浏览器环境中
    if (!this.isBrowser()) {
      console.warn('复制功能仅在浏览器环境中可用');
      return false;
    }
    
    try {
      // 检查是否支持现代Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        // 使用现代Clipboard API复制
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Clipboard API不可用，使用降级方法
        return this.fallbackCopyTextToClipboard(text);
      }
    } catch (error) {
      // 复制文案失败
      console.error('复制文案失败:', error);
      return false;
    }
  }

  /**
   * 降级复制方法
   * 当现代Clipboard API不可用时，使用传统的textarea方法复制
   * 
   * 实现原理：
   * 1. 创建一个隐藏的textarea元素
   * 2. 将要复制的文本设置到textarea中
   * 3. 选中文本内容
   * 4. 执行document.execCommand('copy')复制选中的文本
   * 5. 清理textarea元素
   * 
   * 隐藏技巧：
   * - 使用position: fixed将元素固定在视窗外
   * - left和top设置为-999999px，确保用户看不到
   * - 这是兼容性最好的降级复制方法
   * 
   * 注意：
   * - document.execCommand('copy') 已被废弃，但兼容性极好
   * - 现代浏览器推荐使用navigator.clipboard API
   * - 这个方法在大多数浏览器中仍然有效
   * 
   * @param {string} text - 要复制的文本内容
   * @returns {boolean} 复制成功返回true，失败返回false
   */
  fallbackCopyTextToClipboard(text) {
    // 检查是否在浏览器环境中
    if (!this.isBrowser()) {
      console.warn('复制功能仅在浏览器环境中可用');
      return false;
    }
    
    try {
      // 创建textarea元素
      const textArea = document.createElement('textarea');
      textArea.value = text;  // 设置要复制的文本
      
      // 将元素隐藏（固定在视窗外）
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      
      // 将textarea添加到页面（必须添加到DOM才能选中）
      document.body.appendChild(textArea);
      textArea.focus();    // 获取焦点
      textArea.select();   // 选中所有文本
      
      // 执行复制命令
      const success = document.execCommand('copy');
      
      // 清理textarea元素
      document.body.removeChild(textArea);
      
      // 返回复制结果
      return success;
    } catch (error) {
      // 降级复制失败
      console.error('降级复制失败:', error);
      return false;
    }
  }

  /**
   * 获取可用的分享方式列表
   * 根据当前环境检测支持的分享方式
   * 
   * 检测方法：
   * 1. 检查是否在浏览器环境中
   * 2. 检查是否支持Web Share API（系统分享）
   * 3. 如果支持，添加'system'到列表
   * 4. 添加'saveImage'、'copyLink'、'copyText'到列表
   * 
   * 返回列表说明：
   * - system: 系统分享（Web Share API）
   * - saveImage: 保存图片到本地
   * - copyLink: 复制分享链接
   * - copyText: 复制文案
   * 
   * @returns {Array<string>} 返回可用的分享方式列表
   */
  getShareMethods() {
    const methods = [];
    
    // 检查是否支持系统分享
    if (this.isBrowser() && navigator.share) {
      methods.push('system');
    }
    
    // 其他分享方式在浏览器环境中都可用
    if (this.isBrowser()) {
      methods.push('saveImage', 'copyLink', 'copyText');
    }
    
    return methods;
  }

  /**
   * 检查是否支持系统分享（Web Share API）
   * 
   * @returns {boolean} 支持返回true，否则返回false
   */
  isShareSupported() {
    return this.isBrowser() && navigator.share !== undefined;
  }

  /**
   * 检查是否支持剪贴板API
   * 需要同时满足：
   * 1. 在浏览器环境中
   * 2. navigator.clipbedboard可用
   * 3. 安全上下文（HTTPS或localhost）
   * 
   * @returns {boolean} 支持返回true，否则返回false
   */
  isClipboardSupported() {
    return this.isBrowser() && navigator.clipboard !== undefined && window.isSecureContext;
  }

  /**
   * 生成分享链接
   * 根据分享ID生成完整的分享链接
   * 
   * 链接格式：https://huashuo.app/s/share_id
   * 
   * @param {string} shareId - 分享链接的唯一ID
   * @returns {string} 返回完整的分享链接
   */
  generateShareLink(shareId) {
    // 拼接基础URL和分享ID
    return `${this.baseUrl}/${shareId}`;
  }

  /**
   * 记录分享操作
   * 将分享行为保存到本地存储，用于统计分析
   * 
   * 记录对象结构：
   * {
   *   id: '唯一ID',
   *   card_id: '卡片ID',
   *   action_type: '分享方式',  // 'system'、'saveImage'等
   *   created_at: 1234567890   // 分享时间戳
   * }
   * 
   * @param {string} cardId - 卡片ID
   * @param {string} actionType - 分享方式类型
   */
  recordShareAction(cardId, actionType) {
    try {
      // 创建分享记录对象
      const shareRecord = {
        id: this.generateId(),        // 生成唯一ID
        card_id: cardId,              // 关联的卡片ID
        action_type: actionType,      // 分享方式（system、saveImage等）
        created_at: Date.now()        // 分享时间
      };
      
      // 保存到本地存储的'share_records'存储对象
      localStorageModule.saveData('share_records', shareRecord);
    } catch (error) {
      // 记录分享操作失败
      // 这只是统计功能，失败不影响主流程
      console.error('记录分享操作失败:', error);
    }
  }

  /**
   * 获取分享记录
   * 从本地存储中读取分享记录，可按卡片ID过滤
   * 
   * @param {string} [cardId] - 可选，要查询的卡片ID
   * @returns {Promise<Array>} 返回分享记录数组
   */
  async getShareRecords(cardId) {
    try {
      // 获取所有分享记录
      const allRecords = await localStorageModule.getAllData('share_records');
      
      // 如果提供了卡片ID，过滤出该卡片的记录
      if (cardId) {
        return allRecords.filter(record => record.card_id === cardId);
      }
      
      // 否则返回所有记录
      return allRecords;
    } catch (error) {
      // 获取分享记录失败
      console.error('获取分享记录失败:', error);
      return [];
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async shareCard(cardData, imageBlob) {
    try {
      const shared = await this.shareViaSystem(cardData, imageBlob);
      if (shared) {
        return { success: true, method: 'system' };
      } else {
        return { success: false, method: 'fallback' };
      }
    } catch (error) {
      console.error('分享卡片失败:', error);
      return { success: false, error: error.message };
    }
  }

  async shareWithFallback(cardData, imageBlob) {
    try {
      const shareLink = this.generateShareLink(cardData.share_id);
      const copyLinkSuccess = await this.copyShareLink(cardData.share_id);
      const copyTextSuccess = await this.copyText(cardData.ai_poem);
      return {
        success: true,
        shareLink: shareLink,
        copyLinkSuccess: copyLinkSuccess,
        copyTextSuccess: copyTextSuccess
      };
    } catch (error) {
      console.error('兜底分享失败:', error);
      return { success: false, error: error.message };
    }
  }

  async testShareCapabilities() {
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    return {
      systemShare: this.isShareSupported(),
      clipboard: this.isClipboardSupported(),
      saveImage: isBrowser && typeof document.createElement === 'function'
    };
  }

  isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
}

// ==========================================
// 模块导出
// ==========================================
// 导出单例实例，确保整个应用中只有一个分享功能模块实例
// 
// 使用方式：
// import shareFunctionalityModule from './src/share/shareFunctionality.js';
// await shareFunctionalityModule.shareCard(cardData, imageBlob);

const shareFunctionalityModule = new ShareFunctionalityModule();
export default shareFunctionalityModule;
