/**
 * ============================================
 * 卡片生成模块 (cardGeneration.js)
 * ============================================
 * 
 * 功能说明：
 * 本模块负责将心事帖子和AI生成的内容转换为可视化的分享卡片。
 * 用户可以将自己的心事制作成精美的卡片图片，分享给朋友或保存到本地。
 * 
 * 核心功能：
 * 1. 创建卡片数据：将帖子ID和AI结果关联，生成卡片记录
 * 2. 渲染卡片：使用Canvas API绘制卡片，包括背景、诗句、表情包和二维码
 * 3. 导出卡片：将Canvas转换为图片格式（PNG），支持压缩优化
 * 4. 分享卡片：通过Web Share API分享卡片，不支持时提供兜底方案
 * 5. 管理卡片：支持查询、更新、删除卡片，以及增加拥抱计数
 * 
 * 卡片布局：
 * - 背景：渐变灰色背景 + 边框装饰
 * - 诗句：居中显示在卡片中央（24px字体）
 * - 表情包：显示在卡片下方，白色圆角气泡样式
 * - 二维码：显示在卡片底部，扫码可跳转到分享页面
 * 
 * 技术实现：
 * - 使用Canvas API进行2D图形绘制
 * - 使用渐变、阴影等视觉效果增强美观度
 * - 使用文本自动换行算法处理长文本
 * - 使用图片压缩算法控制文件大小（最大300KB）
 * 
 * 分享链接：
 * - 每个卡片生成唯一的share_id
 * - 分享链接格式：https://huashuo.app/share?id=share_id
 * - 其他人可以通过链接查看卡片内容并给予拥抱反馈
 * 
 * 作者：话说APP开发团队
 * 创建日期：2024年
 * 最后更新：2026年4月
 */

import localStorageModule from '../storage/localStorage.js';
import aiTranslationModule from '../ai/aiTranslation.js';

/**
 * 卡片生成模块类
 * 实现了卡片的完整生命周期管理：创建、渲染、导出、分享、管理
 */
class CardGenerationModule {
  /**
   * 构造函数：初始化卡片尺寸和分享链接基础URL
   */
  constructor() {
    // 卡片宽度（像素）
    // 600px是一个适合移动端显示的宽度
    this.cardWidth = 600;
    
    // 卡片高度（像素）
    // 800px提供了足够的空间显示所有元素
    this.cardHeight = 800;
    
    this.baseUrl = this._resolveBaseUrl();
  }

  _resolveBaseUrl() {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}/s`;
    }
    return 'https://huashuo.app/s';
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
   * @returns {string} 返回生成的唯一ID字符串
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * 创建新卡片
   * 将帖子ID和AI结果关联，生成卡片记录并保存到本地存储
   * 
   * 创建流程：
   * 1. 验证帖子ID的合法性
   * 2. 验证AI结果的完整性（必须包含ai_poem和stickers）
   * 3. 生成卡片ID和分享ID
   * 4. 创建卡片对象，包含所有必要字段
   * 5. 保存到本地存储的'cards'存储对象中
   * 6. 返回创建的卡片对象
   * 
   * 卡片对象结构：
   * {
   *   id: '卡片唯一ID',
   *   post_id: '关联的心事帖子ID',
   *   share_id: '分享链接唯一ID',
   *   ai_poem: 'AI生成的诗句',
   *   sticker_comfort: '安慰类表情包文案',
   *   sticker_gossip: '吃瓜类表情包文案',
   *   sticker_roast: '损友类表情包文案',
   *   sticker_selected_type: 'comfort',  // 默认选中的表情包类型
   *   hugs_count: 0,                     // 拥抱计数，初始为0
   *   created_at: 1234567890,            // 创建时间戳（毫秒）
   *   exported_at: null,                 // 导出时间戳，null表示未导出
   *   synced_at: null                    // 同步时间戳，null表示未同步
   * }
   * 
   * @param {string} postId - 关联的心事帖子ID
   * @param {Object} aiResult - AI生成的结果对象
   * @param {string} aiResult.ai_poem - AI生成的诗句
   * @param {Object} aiResult.stickers - AI生成的表情包对象
   * @param {string} aiResult.stickers.comfort - 安慰类表情包文案
   * @param {string} aiResult.stickers.gossip - 吃瓜类表情包文案
   * @param {string} aiResult.stickers.roast - 损友类表情包文案
   * @returns {Promise<Object>} 返回创建的卡片对象
   * @throws {Error} 如果帖子ID无效或AI结果不完整，抛出错误
   */
  async createCard(postId, aiResult) {
    // 验证帖子ID的合法性
    // ID不能为空，必须是字符串类型
    if (!postId || typeof postId !== 'string') {
      throw new Error('心事ID无效');
    }

    // 验证AI结果的完整性
    // 必须包含ai_poem（诗句）和stickers（表情包）
    // 缺少任何一个都会导致卡片渲染失败
    if (!aiResult || !aiResult.ai_poem || !aiResult.stickers) {
      throw new Error('AI结果无效');
    }

    // 创建卡片对象
    const card = {
      id: this.generateId(),              // 生成卡片唯一ID
      post_id: postId,                    // 关联的心事帖子ID
      share_id: this.generateId(),        // 生成分享链接唯一ID
      ai_poem: aiResult.ai_poem,          // AI生成的诗句
      sticker_comfort: aiResult.stickers.comfort,   // 安慰类表情包文案
      sticker_gossip: aiResult.stickers.gossip,     // 吃瓜类表情包文案
      sticker_roast: aiResult.stickers.roast,       // 损友类表情包文案
      sticker_selected_type: 'comfort',   // 默认选中安慰类表情包
      hugs_count: 0,                      // 拥抱计数，初始为0
      created_at: Date.now(),             // 创建时间（当前时间戳）
      exported_at: null,                  // 导出时间，null表示未导出
      synced_at: null                     // 同步时间，null表示未同步
    };

    // 保存到本地存储的'cards'存储对象
    // 使用localStorageModule的saveData方法，支持三级存储策略
    await localStorageModule.saveData('cards', card);
    
    // 返回创建的卡片对象
    return card;
  }

  /**
   * 获取指定卡片的详细信息
   * 根据卡片ID从本地存储中读取卡片对象
   * 
   * @param {string} cardId - 要获取的卡片ID
   * @returns {Promise<Object>} 返回卡片对象
   * @throws {Error} 如果卡片ID无效或卡片不存在，抛出错误
   */
  async getCard(cardId) {
    if (!cardId || typeof cardId !== 'string') {
      throw new Error('卡片ID无效');
    }

    const card = await localStorageModule.getData('cards', cardId);
    
    if (!card) {
      throw new Error('卡片不存在');
    }

    if (card.deleted_at) {
      throw new Error('卡片不存在');
    }

    return card;
  }

  /**
   * 更新指定卡片的信息
   * 支持更新卡片的任何字段（如sticker_selected_type、hugs_count等）
   * 
   * 更新策略：
   * 1. 先读取现有卡片数据
   * 2. 使用对象展开运算符合并现有数据和新数据
   * 3. 保存更新后的数据
   * 
   * @param {string} cardId - 要更新的卡片ID
   * @param {Object} updates - 要更新的字段对象
   * @returns {Promise<Object>} 返回更新后的卡片对象
   */
  async updateCard(cardId, updates) {
    // 获取现有卡片数据
    const card = await this.getCard(cardId);
    
    // 合并现有数据和新数据
    // 使用对象展开运算符，新数据会覆盖现有数据的同名字段
    const updatedCard = {
      ...card,        // 保留原有所有字段
      ...updates      // 应用新的更新字段
    };

    // 保存到本地存储
    await localStorageModule.saveData('cards', updatedCard);
    
    // 返回更新后的卡片对象
    return updatedCard;
  }

  /**
   * 渲染卡片为Canvas对象
   * 使用Canvas API绘制卡片的视觉元素，包括背景、诗句、表情包和二维码
   * 
   * 渲染流程：
   * 1. 创建Canvas元素，设置宽高
   * 2. 绘制背景（渐变灰色 + 边框）
   * 3. 绘制诗句（居中显示，自动换行）
   * 4. 绘制表情包（白色圆角气泡样式）
   * 5. 绘制二维码（如果有share_id）
   * 6. 返回Canvas对象
   * 
   * Canvas API说明：
   * - createElement('canvas'): 创建Canvas元素
   * - getContext('2d'): 获取2D渲染上下文
   * - fillRect(): 填充矩形
   * - fillText(): 绘制文字
   * - drawImage(): 绘制图片（用于二维码）
   * 
   * @param {Object} cardData - 卡片数据对象
   * @returns {HTMLCanvasElement} 返回渲染完成的Canvas对象
   * @throws {Error} 如果渲染失败，抛出错误
   */
  async generateCard(cardData) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.cardWidth;
      canvas.height = this.cardHeight;
      const ctx = canvas.getContext('2d');

      this.drawBackground(ctx);
      this.drawPoem(ctx, cardData.ai_poem);
      this.drawSticker(ctx, cardData);

      if (cardData.share_id) {
        const qrCodeDataUrl = await this.generateQRCode(cardData.share_id);
        this.drawQRCode(ctx, qrCodeDataUrl);
      }

      return canvas;
    } catch (error) {
      console.error('卡片生成失败:', error);
      throw new Error('卡片生成失败');
    }
  }

  /**
   * 绘制卡片背景
   * 使用线性渐变创建从浅灰到中灰的背景，并添加边框装饰
   * 
   * 渐变颜色：
   * - 起始颜色：#f8f9fa（非常浅的灰色）
   * - 结束颜色：#e9ecef（中等浅灰色）
   * 
   * 边框：
   * - 颜色：#dee2e6（浅灰色）
   * - 宽度：2px
   * - 位置：距离边缘10px
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D渲染上下文
   */
  drawBackground(ctx) {
    // 创建线性渐变
    // 从左上角(0,0)到右下角(cardWidth, cardHeight)
    const gradient = ctx.createLinearGradient(0, 0, this.cardWidth, this.cardHeight);
    gradient.addColorStop(0, '#f8f9fa');    // 起始颜色（非常浅的灰色）
    gradient.addColorStop(1, '#e9ecef');    // 结束颜色（中等浅灰色）
    
    // 填充渐变背景
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.cardWidth, this.cardHeight);

    // 绘制边框
    ctx.strokeStyle = '#dee2e6';    // 边框颜色（浅灰色）
    ctx.lineWidth = 2;              // 边框宽度（2px）
    // 绘制矩形边框，距离边缘10px
    ctx.strokeRect(10, 10, this.cardWidth - 20, this.cardHeight - 20);
  }

  /**
   * 绘制诗句文字
   * 将诗句居中显示在卡片中央，支持自动换行
   * 
   * 文字样式：
   * - 颜色：#212529（深灰色，接近黑色）
   * - 字体：24px Arial
   * - 对齐：居中对齐
   * 
   * 自动换行算法：
   * - 使用wrapText()方法将长文本拆分为多行
   * - 计算起始Y坐标，使文字块垂直居中
   * - 逐行绘制文字，每行间隔30px
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D渲染上下文
   * @param {string} poem - 要绘制的诗句文字
   */
  drawPoem(ctx, poem) {
    // 设置文字颜色（深灰色）
    ctx.fillStyle = '#212529';
    // 设置字体（24px Arial，无衬线字体）
    ctx.font = '24px Arial, sans-serif';
    // 设置文字对齐方式为居中
    ctx.textAlign = 'center';
    // 设置文字基线为中间，便于垂直居中
    ctx.textBaseline = 'middle';

    // 计算最大宽度（卡片宽度减去左右各40px的边距）
    const maxWidth = this.cardWidth - 80;
    // 将诗句文字拆分为多行（自动换行）
    const lines = this.wrapText(poem, ctx, maxWidth);
    // 计算起始Y坐标，使文字块垂直居中
    // 公式：卡片中心 - (文字块高度 / 2)
    const startY = this.cardHeight / 2 - (lines.length * 30) / 2;

    // 逐行绘制文字
    lines.forEach((line, index) => {
      // 在计算好的位置绘制文字
      ctx.fillText(line, this.cardWidth / 2, startY + index * 30);
    });
  }

  /**
   * 绘制表情包
   * 在卡片下方绘制一个白色圆角气泡，显示选中的表情包文案
   * 
   * 表情包样式：
   * - 背景：半透明白色（rgba(255, 255, 255, 0.9)）
   * - 阴影：浅黑色阴影，偏移(2, 2)，模糊5px
   * - 圆角：20px圆角矩形
   * - 文字：18px Arial，深灰色（#495057）
   * 
   * 位置计算：
   * - 水平居中：(卡片宽度 - 气泡宽度) / 2
   * - 垂直位置：卡片高度 - 200px - 气泡高度的一半
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D渲染上下文
   * @param {Object} cardData - 卡片数据对象
   */
  drawSticker(ctx, cardData) {
    // 获取选中的表情包类型（默认为'comfort'安慰类）
    const selectedType = cardData.sticker_selected_type || 'comfort';
    // 根据类型获取对应的表情包文案
    // 使用动态键名：sticker_comfort、sticker_gossip或sticker_roast
    const stickerText = cardData[`sticker_${selectedType}`];

    // 如果表情包文案存在，绘制它
    if (stickerText) {
      // 设置气泡背景颜色（半透明白色）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      
      // 设置阴影效果，增加立体感
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';  // 阴影颜色（浅黑色）
      ctx.shadowBlur = 5;                       // 阴影模糊半径（5px）
      ctx.shadowOffsetX = 2;                    // 阴影X偏移（2px）
      ctx.shadowOffsetY = 2;                    // 阴影Y偏移（2px）

      // 计算气泡尺寸
      const padding = 15;           // 内边距（15px）
      const fontSize = 18;          // 字体大小（18px）
      ctx.font = `${fontSize}px Arial, sans-serif`;  // 设置字体
      const textWidth = ctx.measureText(stickerText).width;  // 测量文字宽度
      const boxWidth = textWidth + padding * 2;   // 气泡宽度 = 文字宽度 + 左右内边距
      const boxHeight = fontSize + padding * 2;   // 气泡高度 = 字体高度 + 上下内边距

      // 计算气泡位置（水平居中，垂直在卡片下方）
      const x = (this.cardWidth - boxWidth) / 2;  // X坐标（水平居中）
      const y = this.cardHeight - 200 - boxHeight / 2;  // Y坐标（距离底部200px）

      // 绘制圆角矩形气泡
      ctx.beginPath();
      ctx.roundRect(x, y, boxWidth, boxHeight, 20);  // 20px圆角
      ctx.fill();  // 填充气泡背景

      // 绘制表情包文字
      ctx.fillStyle = '#495057';    // 文字颜色（深灰色）
      ctx.textAlign = 'center';     // 文字居中对齐
      ctx.textBaseline = 'middle';  // 文字基线为中间
      ctx.shadowBlur = 0;           // 清除阴影（文字不需要阴影）
      // 在气泡中心绘制文字
      ctx.fillText(stickerText, x + boxWidth / 2, y + boxHeight / 2);
    }
  }

  /**
   * 绘制二维码
   * 在卡片底部绘制二维码和提示文字"扫码查看详情"
   * 
   * 二维码样式：
   * - 尺寸：120x120px
   * - 位置：水平居中，距离底部50px
   * - 提示文字：12px Arial，灰色（#6c757d），位于二维码上方15px
   * 
   * 注意：二维码是一个异步加载的图片，使用img.onload确保加载完成后再绘制
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D渲染上下文
   * @param {string} qrCodeDataUrl - 二维码的Data URL（base64编码的图片）
   */
  drawQRCode(ctx, qrCodeDataUrl) {
    // 二维码尺寸（120x120px）
    const qrSize = 120;
    // 计算二维码位置（水平居中）
    const x = (this.cardWidth - qrSize) / 2;
    // 垂直位置：距离底部50px
    const y = this.cardHeight - qrSize - 50;

    // 创建图片对象加载二维码
    const img = new Image();
    // 图片加载完成后绘制到Canvas
    img.onload = () => {
      // 在计算好的位置绘制二维码图片
      ctx.drawImage(img, x, y, qrSize, qrSize);
    };
    // 设置图片源（Data URL格式的base64图片）
    img.src = qrCodeDataUrl;

    // 绘制提示文字"扫码查看详情"
    ctx.fillStyle = '#6c757d';    // 文字颜色（灰色）
    ctx.font = '12px Arial, sans-serif';  // 字体（12px）
    ctx.textAlign = 'center';     // 文字居中对齐
    // 在二维码上方15px处绘制提示文字
    ctx.fillText('扫码查看详情', this.cardWidth / 2, y - 15);
  }

  /**
   * 生成二维码
   * 创建一个简单的二维码占位符，包含分享ID的前8个字符
   * 
   * 注意：这是一个简化的实现，真正的二维码需要使用专门的二维码生成库
   * 当前实现只创建一个白色背景的方框，中间显示分享ID的前8个字符
   * 
   * @param {string} shareId - 分享链接的唯一ID
   * @returns {string} 返回二维码的Data URL（base64编码的PNG图片）
   */
  async generateQRCode(shareId) {
    const url = `${this.baseUrl}/${shareId}`;
    try {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 120,
        margin: 1,
        color: { dark: '#1a1a2e', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      });
      return dataUrl;
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 120, 120);
      ctx.fillStyle = '#000000';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(shareId.substring(0, 8), 60, 60);
      return canvas.toDataURL('image/png');
    }
  }

  /**
   * 导出卡片为图片
   * 将Canvas对象转换为PNG格式的Blob对象，支持压缩优化
   * 
   * 压缩策略：
   * - 初始质量：0.9（90%质量）
   * - 如果图片大小超过300KB，逐步降低质量（每次降低0.1）
   * - 最低质量：0.5（50%质量）
   * - 确保导出的图片大小在300KB以内，便于分享和存储
   * 
   * Data URL转Blob：
   * - Data URL是base64编码的图片字符串
   * - Blob是二进制大对象，更适合文件操作
   * - 使用dataURLToBlob()方法进行转换
   * 
   * @param {HTMLCanvasElement} canvas - 要导出的Canvas对象
   * @returns {Blob} 返回导出的图片Blob对象
   * @throws {Error} 如果导出失败，抛出错误
   */
  exportCard(canvas) {
    try {
      let quality = 0.92;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      const maxBytes = 300 * 1024;

      while (this._estimateDataUrlSize(dataUrl) > maxBytes && quality > 0.5) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      const blob = this.dataURLToBlob(dataUrl);
      return blob;
    } catch (error) {
      console.error('卡片导出失败:', error);
      throw new Error('卡片导出失败');
    }
  }

  _estimateDataUrlSize(dataUrl) {
    const base64 = dataUrl.split(',')[1] || '';
    return Math.floor(base64.length * 3 / 4);
  }

  /**
   * 分享卡片
   * 使用Web Share API分享卡片，不支持时提供兜底方案
   * 
   * 分享流程：
   * 1. 检查浏览器是否支持Web Share API（navigator.share）
   * 2. 如果支持，调用navigator.share()分享卡片
   * 3. 如果不支持，抛出错误，使用兜底方案
   * 
   * Web Share API：
   * - 现代浏览器提供的原生分享功能
   * - 可以调用系统分享面板（微信、QQ、微博等）
   * - 只在HTTPS环境下可用
   * - 移动端浏览器支持较好，桌面端支持较差
   * 
   * 兜底方案：
   * - 当Web Share API不可用时，返回false
   * - 调用者可以使用复制分享链接的方式作为替代
   * 
   * @param {Object} cardData - 卡片数据对象
   * @param {Blob} imageBlob - 导出的图片Blob对象
   * @returns {Promise<boolean>} 分享成功返回true，失败返回false
   */
  async shareCard(cardData, imageBlob) {
    try {
      // 检查浏览器是否支持Web Share API
      if (navigator.share) {
        // 调用Web Share API分享卡片
        await navigator.share({
          title: '话说APP - 心情卡片',    // 分享标题
          text: cardData.ai_poem,          // 分享内容（诗句）
          url: this.generateShareLink(cardData.share_id)  // 分享链接
        });
        // 分享成功
        return true;
      } else {
        // 浏览器不支持Web Share API
        throw new Error('Web Share API not supported');
      }
    } catch (error) {
      // 分享失败，记录警告日志
      // 使用console.warn而不是error，因为降级是正常行为
      console.warn('分享失败，使用兜底方案:', error);
      // 返回false，调用者可以使用兜底方案（如复制链接）
      return false;
    }
  }

  /**
   * 生成分享链接
   * 根据分享ID生成完整的分享链接
   * 
   * 链接格式：https://huashuo.app/share?id=share_id
   * 
   * @param {string} shareId - 分享链接的唯一ID
   * @returns {string} 返回完整的分享链接
   */
  generateShareLink(shareId) {
    // 拼接基础URL和分享ID
    return `${this.baseUrl}/${shareId}`;
  }

  /**
   * 文字自动换行算法
   * 将长文本拆分为多行，每行不超过最大宽度
   * 
   * 算法逻辑：
   * 1. 按空格拆分文本为单词数组
   * 2. 从第一个单词开始，逐个添加单词到当前行
   * 3. 如果添加后超过最大宽度，将当前行保存为新行，重新开始下一行
   * 4. 继续处理剩余单词，直到所有单词处理完毕
   * 
   * 注意：这个算法适用于英文等有空格分隔的语言
   * 对于中文等没有空格分隔的语言，可能需要更复杂的算法
   * 
   * @param {string} text - 要拆分的文本
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D渲染上下文（用于测量文字宽度）
   * @param {number} maxWidth - 每行的最大宽度（像素）
   * @returns {Array<string>} 返回拆分后的文字行数组
   */
  wrapText(text, ctx, maxWidth) {
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '\n') {
        lines.push(currentLine);
        currentLine = '';
        continue;
      }
      const testLine = currentLine + ch;
      if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = ch;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  /**
   * Data URL转Blob
   * 将base64编码的Data URL转换为二进制Blob对象
   * 
   * 转换流程：
   * 1. 拆分Data URL，获取MIME类型和base64数据
   * 2. 使用atob()解码base64数据为二进制字符串
   * 3. 将二进制字符串转换为Uint8Array（无符号8位整数数组）
   * 4. 创建Blob对象，指定MIME类型
   * 
   * Data URL格式：data:[MIME类型];base64,[base64编码的数据]
   * 例如：data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...
   * 
   * @param {string} dataUrl - Data URL字符串（base64编码的图片）
   * @returns {Blob} 返回转换后的Blob对象
   */
  dataURLToBlob(dataUrl) {
    // 拆分Data URL，逗号前面是MIME类型，后面是base64数据
    const arr = dataUrl.split(',');
    // 使用正则表达式提取MIME类型
    const mime = arr[0].match(/:(.*?);/)[1];
    // 使用atob()解码base64数据为二进制字符串
    const bstr = atob(arr[1]);
    let n = bstr.length;
    // 创建Uint8Array，用于存储二进制数据
    const u8arr = new Uint8Array(n);
    // 将二进制字符串的每个字符转换为对应的ASCII码
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    // 创建Blob对象，指定MIME类型
    return new Blob([u8arr], { type: mime });
  }

  /**
   * 根据帖子ID获取卡片
   * 查找与指定帖子关联的卡片（未删除的）
   * 
   * @param {string} postId - 心事帖子ID
   * @returns {Promise<Object>} 返回找到的卡片对象
   * @throws {Error} 如果帖子ID无效或卡片不存在，抛出错误
   */
  async getCardByPostId(postId) {
    // 验证帖子ID的合法性
    if (!postId || typeof postId !== 'string') {
      throw new Error('心事ID无效');
    }

    // 获取所有卡片数据
    const cards = await localStorageModule.getAllData('cards');
    // 查找与指定帖子关联且未删除的卡片
    const card = cards.find(c => c.post_id === postId && !c.deleted_at);

    // 检查是否找到卡片
    if (!card) {
      throw new Error('卡片不存在');
    }

    // 返回找到的卡片对象
    return card;
  }

  /**
   * 删除指定卡片
   * 将卡片标记为删除状态，设置删除时间戳（软删除）
   * 
   * @param {string} cardId - 要删除的卡片ID
   * @returns {Promise<Object>} 返回删除后的卡片对象
   */
  async deleteCard(cardId) {
    // 获取现有卡片数据
    const card = await this.getCard(cardId);
    
    // 创建更新后的卡片对象，设置删除时间
    const updatedCard = {
      ...card,                // 保留原有所有字段
      deleted_at: Date.now()  // 设置删除时间为当前时间戳
    };

    // 保存到本地存储
    await localStorageModule.saveData('cards', updatedCard);
    
    // 返回删除后的卡片对象
    return updatedCard;
  }

  /**
   * 增加卡片的拥抱计数
   * 当其他人查看卡片并给予拥抱时，调用此方法增加计数
   * 
   * @param {string} cardId - 卡片ID
   * @returns {Promise<Object>} 返回更新后的卡片对象
   */
  async incrementHug(cardId) {
    // 获取现有卡片数据
    const card = await this.getCard(cardId);
    
    // 创建更新后的卡片对象，拥抱计数加1
    const updatedCard = {
      ...card,                    // 保留原有所有字段
      hugs_count: card.hugs_count + 1  // 拥抱计数加1
    };

    // 保存到本地存储
    await localStorageModule.saveData('cards', updatedCard);
    
    // 返回更新后的卡片对象
    return updatedCard;
  }
}

// ==========================================
// 模块导出
// ==========================================
// 导出单例实例，确保整个应用中只有一个卡片生成模块实例
// 
// 使用方式：
// import cardGenerationModule from './src/card/cardGeneration.js';
// const card = await cardGenerationModule.createCard(postId, aiResult);
// const canvas = cardGenerationModule.generateCard(card);
// const blob = cardGenerationModule.exportCard(canvas);

const cardGenerationModule = new CardGenerationModule();
export default cardGenerationModule;
