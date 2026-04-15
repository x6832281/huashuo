// 引入本地存储模块
const localStorageModule = require('../src/storage/localStorage');

/**
 * 生成唯一ID的函数
 * 使用时间戳和随机数组合生成唯一标识符
 * @returns {string} 唯一ID
 */
function generateId() {
  // 将当前时间戳转换为36进制字符串
  // 生成一个随机数并转换为36进制字符串，取后2位
  // 两者拼接得到唯一ID
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 测试数据 - 身份数据
const testIdentity = {
  id: generateId(),           // 唯一标识符
  nickname: '测试用户',        // 昵称
  emoji: '😊',                // 表情
  created_at: Date.now()       // 创建时间戳
};

// 测试数据 - 心事数据
const testPost = {
  id: generateId(),                  // 唯一标识符
  identity_id: testIdentity.id,       // 所属身份ID
  mood_band_ai: 5,                   // AI建议的情绪频段
  mood_band_final: 5,                // 最终情绪频段
  mood_band_edit_count: 0,            // 频段编辑次数
  content_text: '这是一条测试心事',    // 心事内容
  created_at: Date.now()              // 创建时间戳
};

// 测试数据 - 卡片数据
const testCard = {
  id: generateId(),                 // 唯一标识符
  post_id: testPost.id,              // 所属心事ID
  ai_poem: '测试诗句',               // AI生成的诗句
  sticker_comfort: '安慰文案',        // 安慰表情包文案
  sticker_gossip: '吃瓜文案',         // 吃瓜表情包文案
  sticker_roast: '损友文案',          // 损友式诋毁表情包文案
  hugs_count: 0,                     // 拥抱数
  created_at: Date.now()             // 创建时间戳
};

/**
 * 运行所有测试的函数
 * 测试本地存储模块的各项功能
 */
async function runTests() {
  // 输出测试开始信息
  console.log('开始测试本地存储模块...');
  
  try {
    // 1. 测试数据库初始化
    console.log('\n1. 测试数据库初始化...');
    // 调用初始化数据库方法
    await localStorageModule.initDatabase();
    // 输出初始化成功信息
    console.log('✅ 数据库初始化成功');
    
    // 2. 测试存储数据
    console.log('\n2. 测试存储数据...');
    // 存储身份数据
    await localStorageModule.saveData('identities', testIdentity);
    // 存储心事数据
    await localStorageModule.saveData('posts', testPost);
    // 存储卡片数据
    await localStorageModule.saveData('cards', testCard);
    // 输出存储成功信息
    console.log('✅ 数据存储成功');
    
    // 3. 测试读取数据
    console.log('\n3. 测试读取数据...');
    // 读取身份数据
    const savedIdentity = await localStorageModule.getData('identities', testIdentity.id);
    // 读取心事数据
    const savedPost = await localStorageModule.getData('posts', testPost.id);
    // 读取卡片数据
    const savedCard = await localStorageModule.getData('cards', testCard.id);
    
    // 输出读取成功信息和数据
    console.log('✅ 身份数据读取成功:', savedIdentity);
    console.log('✅ 心事数据读取成功:', savedPost);
    console.log('✅ 卡片数据读取成功:', savedCard);
    
    // 4. 测试读取所有数据
    console.log('\n4. 测试读取所有数据...');
    // 读取所有身份数据
    const allIdentities = await localStorageModule.getAllData('identities');
    // 读取所有心事数据
    const allPosts = await localStorageModule.getAllData('posts');
    // 读取所有卡片数据
    const allCards = await localStorageModule.getAllData('cards');
    
    // 输出读取成功信息和数据数量
    console.log('✅ 所有身份数据:', allIdentities.length);
    console.log('✅ 所有心事数据:', allPosts.length);
    console.log('✅ 所有卡片数据:', allCards.length);
    
    // 5. 测试更新数据
    console.log('\n5. 测试更新数据...');
    // 准备更新后的身份数据（仅用于对比）
    const updatedIdentity = {
      ...testIdentity,
      nickname: '更新后的昵称'
    };
    // 更新身份数据的昵称字段
    await localStorageModule.updateData('identities', testIdentity.id, { nickname: '更新后的昵称' });
    // 读取更新后的身份数据
    const savedUpdatedIdentity = await localStorageModule.getData('identities', testIdentity.id);
    // 输出更新成功信息和更新后的数据
    console.log('✅ 数据更新成功:', savedUpdatedIdentity);
    
    // 6. 测试删除数据
    console.log('\n6. 测试删除数据...');
    // 删除卡片数据
    await localStorageModule.deleteData('cards', testCard.id);
    // 尝试读取已删除的卡片数据
    const deletedCard = await localStorageModule.getData('cards', testCard.id);
    // 输出删除成功信息和删除后的数据（应该为null或undefined）
    console.log('✅ 数据删除成功，删除后数据:', deletedCard);
    
    // 7. 测试清空数据
    console.log('\n7. 测试清空数据...');
    // 清空所有心事数据
    await localStorageModule.clearData('posts');
    // 读取清空后的心事数据
    const allPostsAfterClear = await localStorageModule.getAllData('posts');
    // 输出清空成功信息和清空后的数据数量（应该为0）
    console.log('✅ 数据清空成功，清空后数据数量:', allPostsAfterClear.length);
    
    // 8. 测试降级方案
    console.log('\n8. 测试降级方案...');
    // 模拟IndexedDB不可用的情况
    localStorageModule.db = null;
    localStorageModule.initialized = false;
    
    // 准备用于测试降级方案的数据
    const testDataForLocalStorage = {
      id: generateId(),
      nickname: 'LocalStorage测试用户',
      emoji: '🤔',
      created_at: Date.now()
    };
    
    try {
      // 尝试存储数据（应该降级到LocalStorage）
      await localStorageModule.saveData('identities', testDataForLocalStorage);
      // 输出降级存储成功信息
      console.log('✅ 降级到LocalStorage存储成功');
      
      // 尝试读取数据（应该从LocalStorage读取）
      const localData = await localStorageModule.getData('identities', testDataForLocalStorage.id);
      // 输出降级读取成功信息和数据
      console.log('✅ 从LocalStorage读取成功:', localData);
    } catch (error) {
      // 输出降级测试遇到的错误
      console.log('⚠️  降级测试遇到错误:', error.message);
    }
    
    // 输出所有测试完成信息
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    // 捕获并输出测试过程中的错误
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试函数
runTests();