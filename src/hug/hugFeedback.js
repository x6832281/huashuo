/**
 * ============================================
 * 拥抱反馈模块 (hugFeedback.js)
 * ============================================
 * 
 * 功能说明：
 * 本模块负责管理拥抱计数（hugs_count）的获取、更新和展示。
 * 当其他人查看分享卡片并给予拥抱时，拥抱计数会增加。
 * 用户可以通过此模块获取最新的拥抱计数并展示给用户。
 * 
 * 拥抱计数：
 * - 每张分享卡片有一个拥抱计数（hugs_count）
 * - 当其他人查看卡片并点击拥抱按钮时，计数增加
 * - 拥抱计数存储在服务器端和本地（双重存储）
 * - 用户可以获取最新的拥抱计数并查看统计信息
 * 
 * 工作流程：
 * 1. 获取本地所有卡片的分享ID
 * 2. 调用后端API批量获取最新的拥抱计数
 * 3. 更新本地存储中的拥抱计数
 * 4. 检测新增的拥抱数量
 * 5. 如果有新增拥抱，显示通知提示用户
 * 
 * 离线支持：
 * - 网络离线时跳过API调用，使用本地数据
 * - 拥抱计数本地保存，网络恢复后自动同步
 * 
 * 作者：话说APP开发团队
 * 创建日期：2024年
 * 最后更新：2026年4月
 */

import localStorageModule from '../storage/localStorage.js';

/**
 * 拥抱反馈模块类
 * 实现了拥抱计数的完整生命周期管理：获取、更新、检测、通知、统计
 */
class HugFeedbackModule {
  /**
   * 构造函数：初始化API基础URL
   */
  constructor() {
    // API基础URL
    // 用于构建完整的API请求URL
    // 例如：/api/share/batch 用于批量获取拥抱计数
    this.apiBaseUrl = '/api';
  }

  /**
   * 批量获取拥抱计数
   * 从后端API获取多个分享ID的拥抱计数
   * 
   * 工作流程：
   * 1. 检查网络状态（离线时跳过）
   * 2. 发送POST请求到/api/share/batch
   * 3. 解析响应，获取拥抱计数数据
   * 4. 如果请求失败，使用模拟数据（开发阶段）
   * 
   * API请求说明：
   * - URL: /api/share/batch
   * - Method: POST
   * - Body: { share_ids: ['id1', 'id2', ...] }
   * - Response: { items: [{ share_id: 'id1', hugs_count: 5 }, ...] }
   * - Timeout: 5000ms（5秒超时）
   * 
   * 模拟数据说明：
   * 当前代码中包含了模拟数据（getMockHugCounts），用于开发阶段测试
   * 在生产环境中应该移除模拟数据，直接使用空数组或抛出错误
   * 
   * @param {Array<string>} shareIds - 分享ID数组
   * @returns {Promise<Array>} 返回拥抱计数数组
   *   格式：[{ share_id: 'id1', hugs_count: 5 }, ...]
   */
  async fetchHugCounts(shareIds) {
    // 检查参数有效性
    // 如果shareIds为空或长度为0，直接返回空数组
    if (!shareIds || shareIds.length === 0) {
      return [];
    }

    try {
      // 检查网络状态
      // navigator.onLine 表示浏览器是否在线
      // 离线时跳过API调用，避免请求失败
      if (!navigator.onLine) {
        console.warn('网络离线，跳过拥抱计数拉取');
        return [];
      }

      // 发送POST请求到后端API
      // 使用fetch API进行HTTP请求
      const response = await fetch(`${this.apiBaseUrl}/share/batch`, {
        method: 'POST',    // POST方法
        headers: {
          'Content-Type': 'application/json'    // 请求体为JSON格式
        },
        body: JSON.stringify({ share_ids: shareIds }),  // 请求体：分享ID数组
        timeout: 5000    // 5秒超时
      });

      // 检查API响应状态码
      // 如果响应不是2xx（成功），抛出错误
      if (!response.ok) {
        throw new Error(`拉取拥抱计数失败: ${response.status}`);
      }

      // 解析API响应JSON
      const data = await response.json();
      // 返回拥抱计数数组（data.items 或空数组）
      return data.items || [];
    } catch (error) {
      // API请求失败
      console.error('拉取拥抱计数错误:', error);
      // 使用模拟数据（开发阶段）
      // 注意：生产环境中应该移除模拟数据
      return this.getMockHugCounts(shareIds);
    }
  }

  /**
   * 更新本地拥抱计数
   * 将从API获取的最新拥抱计数更新到本地存储
   * 
   * 更新流程：
   * 1. 遍历所有拥抱计数数据
   * 2. 根据share_id找到本地对应的卡片
   * 3. 更新卡片的hugs_count和synced_at字段
   * 4. 保存到本地存储
   * 5. 返回更新过的卡片列表
   * 
   * 字段说明：
   * - hugs_count: 拥抱计数（整数）
   * - synced_at: 同步时间戳（毫秒），表示最后一次从服务器同步的时间
   * - old_hugs_count: 旧的拥抱计数（用于检测新增拥抱）
   * 
   * @param {Array<Object>} hugCounts - 拥抱计数数组
   * @returns {Promise<Array>} 返回更新过的卡片列表
   *   格式：[{ ...card, old_hugs_count: 3 }, ...]
   */
  async updateLocalHugCounts(hugCounts) {
    // 检查参数有效性
    if (!hugCounts || hugCounts.length === 0) {
      return [];
    }

    try {
      // 存储更新过的卡片
      const updatedCards = [];
      
      // 遍历所有拥抱计数数据
      for (const item of hugCounts) {
        const { share_id, hugs_count } = item;
        
        // 检查数据有效性
        if (!share_id || hugs_count === undefined) {
          continue;  // 跳过无效数据
        }

        // 获取所有本地卡片
        const cards = await localStorageModule.getAllData('cards');
        // 查找与share_id匹配的卡片
        const card = cards.find(c => c.share_id === share_id);
        
        // 如果找到匹配的卡片
        if (card) {
          // 记录旧的拥抱计数（用于后续检测新增拥抱）
          const oldCount = card.hugs_count || 0;
          
          // 更新卡片的拥抱计数和同步时间
          card.hugs_count = hugs_count;
          card.synced_at = Date.now();  // 设置同步时间为当前时间
          
          // 保存到本地存储
          await localStorageModule.saveData('cards', card);
          
          // 添加到更新列表，包含旧的拥抱计数
          updatedCards.push({ ...card, old_hugs_count: oldCount });
        }
      }
      
      // 返回更新过的卡片列表
      return updatedCards;
    } catch (error) {
      // 更新本地拥抱计数失败
      console.error('更新本地拥抱计数错误:', error);
      return [];
    }
  }

  /**
   * 检测新增拥抱
   * 比较旧的拥抱计数和新的拥抱计数，找出新增的拥抱
   * 
   * 检测算法：
   * 1. 遍历新的拥抱计数数据
   * 2. 找到对应的旧拥抱计数
   * 3. 比较新旧计数，如果新计数大于旧计数，说明有新增拥抱
   * 4. 记录新增的拥抱数量和总数
   * 
   * @param {Array<Object>} oldCounts - 旧的拥抱计数数组
   * @param {Array<Object>} newCounts - 新的拥抱计数数组
   * @returns {Array<Object>} 返回新增拥抱数组
   *   格式：[{ share_id: 'id1', added: 2, total: 5 }, ...]
   */
  checkNewHugs(oldCounts, newCounts) {
    // 存储新增拥抱
    const newHugs = [];
    
    // 遍历新的拥抱计数数据
    for (const newItem of newCounts) {
      // 找到对应的旧拥抱计数
      const oldItem = oldCounts.find(item => item.share_id === newItem.share_id);
      // 获取旧的拥抱计数（如果没有，默认为0）
      const oldCount = oldItem ? oldItem.hugs_count || 0 : 0;
      // 获取新的拥抱计数
      const newCount = newItem.hugs_count || 0;
      
      // 如果新计数大于旧计数，说明有新增拥抱
      if (newCount > oldCount) {
        newHugs.push({
          share_id: newItem.share_id,    // 分享ID
          added: newCount - oldCount,    // 新增的拥抱数量
          total: newCount                // 总拥抱数量
        });
      }
    }
    
    // 返回新增拥抱数组
    return newHugs;
  }

  /**
   * 显示拥抱通知
   * 在页面右上角显示一个通知，告知用户收到了多少新拥抱
   * 
   * 通知样式：
   * - 位置：固定在页面右上角（top: 20px, right: 20px）
   * - 背景：蓝色（#4a90e2）
   * - 文字：白色
   * - 内边距：12px 20px
   * - 圆角：8px
   * - 阴影：浅黑色阴影
   * - 动画：从右侧滑入，3秒后滑出
   * 
   * 动画说明：
   * - slideIn：从右侧滑入（transform: translateX(100%) -> translateX(0)）
   * - 3秒后反向播放动画，从右侧滑出
   * - 动画完成后，移除通知元素
   * 
   * @param {number} count - 新增的拥抱数量
   */
  showHugNotification(count) {
    // 检查是否在浏览器环境中
    if (!this.isBrowser()) {
      return;
    }

    // 创建通知元素
    const notification = document.createElement('div');
    // 设置通知样式
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #4a90e2;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;

    // 创建动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    // 将动画样式添加到页面头部
    document.head.appendChild(style);

    // 设置通知文本内容
    notification.textContent = `收到 ${count} 个拥抱！`;
    // 将通知添加到页面
    document.body.appendChild(notification);

    // 3秒后开始滑出动画
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      // 动画完成后（0.3秒），移除通知和动画样式
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 300);
    }, 3000);
  }

  /**
   * 获取回声页数据
   * 获取所有有效卡片（未删除的），按拥抱计数倒序排列
   * 
   * 筛选条件：
   * - 必须有share_id（表示已生成分享链接）
   * - 未删除（deleted_at为null）
   * 
   * 排序规则：
   * - 按hugs_count倒序排列（拥抱数多的在前）
   * - 这样用户可以看到最受欢迎的卡片
   * 
   * @returns {Promise<Array>} 返回有效卡片数组
   */
  async getEchoPageData() {
    try {
      // 获取所有本地卡片
      const cards = await localStorageModule.getAllData('cards');
      
      // 筛选有效卡片：有share_id且未删除
      const validCards = cards.filter(card => 
        card.share_id && !card.deleted_at
      );
      
      // 按拥抱计数倒序排列（拥抱数多的在前）
      validCards.sort((a, b) => {
        const countA = a.hugs_count || 0;
        const countB = b.hugs_count || 0;
        return countB - countA;
      });

      // 返回有效卡片数组
      return validCards;
    } catch (error) {
      // 获取回声页数据失败
      console.error('获取回声页数据错误:', error);
      return [];
    }
  }

  /**
   * 拉取并更新拥抱计数（主入口方法）
   * 完整的工作流程：获取、更新、检测、通知
   * 
   * 工作流程：
   * 1. 获取本地所有卡片的分享ID
   * 2. 保存旧的拥抱计数
   * 3. 调用API获取最新的拥抱计数
   * 4. 更新本地存储
   * 5. 检测新增拥抱
   * 6. 显示通知（如果有新增拥抱）
   * 7. 返回结果
   * 
   * @returns {Promise<Object>} 返回操作结果
   *   格式：{
   *     success: true,
   *     updated: 3,      // 更新的卡片数量
   *     newHugs: [...]   // 新增拥抱列表
   *   }
   */
  async fetchAndUpdateHugCounts() {
    try {
      // 获取所有本地卡片
      const cards = await localStorageModule.getAllData('cards');
      
      // 筛选有效卡片的分享ID
      const shareIds = cards
        .filter(card => card.share_id && !card.deleted_at)  // 有share_id且未删除
        .map(card => card.share_id);  // 提取share_id

      // 如果没有有效卡片，直接返回
      if (shareIds.length === 0) {
        return {
          success: true,
          updated: 0,
          newHugs: []
        };
      }

      // 保存旧的拥抱计数（用于后续检测新增）
      const oldCounts = cards
        .filter(card => card.share_id)  // 只保留有share_id的卡片
        .map(card => ({
          share_id: card.share_id,
          hugs_count: card.hugs_count || 0
        }));

      // 调用API获取最新的拥抱计数
      const hugCounts = await this.fetchHugCounts(shareIds);
      // 更新本地存储中的拥抱计数
      const updatedCards = await this.updateLocalHugCounts(hugCounts);
      // 检测新增拥抱
      const newHugs = this.checkNewHugs(oldCounts, hugCounts);

      // 如果有新增拥抱，显示通知
      newHugs.forEach(item => {
        if (item.added > 0) {
          this.showHugNotification(item.added);
        }
      });

      // 返回操作结果
      return {
        success: true,
        updated: updatedCards.length,  // 更新的卡片数量
        newHugs: newHugs               // 新增拥抱列表
      };
    } catch (error) {
      // 拉取并更新拥抱计数失败
      console.error('拉取并更新拥抱计数错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 检查是否在浏览器环境中
   * 检测window和document是否存在
   * 
   * @returns {boolean} 在浏览器环境返回true，否则返回false
   */
  isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * 获取模拟拥抱计数
   * 用于开发阶段测试，生产环境中应该移除
   * 
   * 模拟数据：
   * - 每个分享ID随机生成1-10个拥抱
   * 
   * @param {Array<string>} shareIds - 分享ID数组
   * @returns {Array<Object>} 返回模拟拥抱计数数组
   */
  getMockHugCounts(shareIds) {
    return shareIds.map(shareId => ({
      share_id: shareId,
      hugs_count: Math.floor(Math.random() * 10) + 1  // 随机1-10个拥抱
    }));
  }

  /**
   * 根据分享ID获取卡片
   * 查找与指定分享ID关联的卡片
   * 
   * @param {string} shareId - 分享链接ID
   * @returns {Promise<Object|null>} 返回找到的卡片对象，如果不存在返回null
   */
  async getCardByShareId(shareId) {
    try {
      // 获取所有本地卡片
      const cards = await localStorageModule.getAllData('cards');
      // 查找与shareId匹配的卡片
      return cards.find(card => card.share_id === shareId);
    } catch (error) {
      // 通过share_id获取卡片失败
      console.error('通过share_id获取卡片错误:', error);
      return null;
    }
  }

  /**
   * 本地增加拥抱计数
   * 当用户在本地给予拥抱时，增加卡片的拥抱计数
   * 
   * 注意：这只是本地增加，不会同步到服务器
   * 服务器同步需要通过fetchAndUpdateHugCounts()方法
   * 
   * @param {string} cardId - 卡片ID
   * @returns {Promise<Object|null>} 返回更新后的卡片对象，如果失败返回null
   */
  async incrementHugLocally(cardId) {
    try {
      // 获取卡片数据
      const card = await localStorageModule.getData('cards', cardId);
      
      // 如果卡片存在，增加拥抱计数
      if (card) {
        card.hugs_count = (card.hugs_count || 0) + 1;  // 拥抱计数加1
        card.synced_at = null;  // 清除同步时间，表示需要同步到服务器
        await localStorageModule.saveData('cards', card);
        return card;
      }
      return null;
    } catch (error) {
      // 本地增加拥抱计数失败
      console.error('本地增加拥抱数错误:', error);
      return null;
    }
  }

  /**
   * 获取拥抱统计信息
   * 计算所有卡片的拥抱统计信息
   * 
   * 统计指标：
   * - total_cards: 有效卡片数量（未删除的）
   * - total_hugs: 总拥抱数量
   * - hug_cards_count: 收到过拥抱的卡片数量
   * - average_hugs_per_card: 平均每张卡片的拥抱数量（保留两位小数）
   * 
   * @returns {Promise<Object>} 返回拥抱统计信息
   *   格式：{
   *     total_cards: 5,
   *     total_hugs: 20,
   *     hug_cards_count: 3,
   *     average_hugs_per_card: 4.00
   *   }
   */
  async getHugStatistics() {
    try {
      // 获取所有本地卡片
      const cards = await localStorageModule.getAllData('cards');
      // 筛选有效卡片（未删除的）
      const validCards = cards.filter(card => !card.deleted_at);
      
      // 计算总拥抱数量
      const totalHugs = validCards.reduce((sum, card) => sum + (card.hugs_count || 0), 0);
      // 计算收到过拥抱的卡片数量
      const hugCardsCount = validCards.filter(card => (card.hugs_count || 0) > 0).length;

      // 返回统计信息
      return {
        total_cards: validCards.length,    // 有效卡片数量
        total_hugs: totalHugs,             // 总拥抱数量
        hug_cards_count: hugCardsCount,    // 收到过拥抱的卡片数量
        average_hugs_per_card: validCards.length > 0 ? (totalHugs / validCards.length).toFixed(2) : 0  // 平均拥抱数量
      };
    } catch (error) {
      // 获取拥抱统计信息失败
      console.error('获取拥抱统计错误:', error);
      return {
        total_cards: 0,
        total_hugs: 0,
        hug_cards_count: 0,
        average_hugs_per_card: 0
      };
    }
  }
}

// ==========================================
// 模块导出
// ==========================================
// 导出单例实例，确保整个应用中只有一个拥抱反馈模块实例
// 
// 使用方式：
// import hugFeedbackModule from './src/hug/hugFeedback.js';
// await hugFeedbackModule.fetchAndUpdateHugCounts();

const hugFeedbackModule = new HugFeedbackModule();
export default hugFeedbackModule;
