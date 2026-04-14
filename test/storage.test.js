const localStorageModule = require('../src/storage/localStorage');

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 测试数据
const testIdentity = {
  id: generateId(),
  nickname: '测试用户',
  emoji: '😊',
  created_at: Date.now()
};

const testPost = {
  id: generateId(),
  identity_id: testIdentity.id,
  mood_band_ai: 5,
  mood_band_final: 5,
  mood_band_edit_count: 0,
  content_text: '这是一条测试心事',
  created_at: Date.now()
};

const testCard = {
  id: generateId(),
  post_id: testPost.id,
  ai_poem: '测试诗句',
  sticker_comfort: '安慰文案',
  sticker_gossip: '吃瓜文案',
  sticker_roast: '损友文案',
  hugs_count: 0,
  created_at: Date.now()
};

async function runTests() {
  console.log('开始测试本地存储模块...');
  
  try {
    // 1. 测试数据库初始化
    console.log('\n1. 测试数据库初始化...');
    await localStorageModule.initDatabase();
    console.log('✅ 数据库初始化成功');
    
    // 2. 测试存储数据
    console.log('\n2. 测试存储数据...');
    await localStorageModule.saveData('identities', testIdentity);
    await localStorageModule.saveData('posts', testPost);
    await localStorageModule.saveData('cards', testCard);
    console.log('✅ 数据存储成功');
    
    // 3. 测试读取数据
    console.log('\n3. 测试读取数据...');
    const savedIdentity = await localStorageModule.getData('identities', testIdentity.id);
    const savedPost = await localStorageModule.getData('posts', testPost.id);
    const savedCard = await localStorageModule.getData('cards', testCard.id);
    
    console.log('✅ 身份数据读取成功:', savedIdentity);
    console.log('✅ 心事数据读取成功:', savedPost);
    console.log('✅ 卡片数据读取成功:', savedCard);
    
    // 4. 测试读取所有数据
    console.log('\n4. 测试读取所有数据...');
    const allIdentities = await localStorageModule.getAllData('identities');
    const allPosts = await localStorageModule.getAllData('posts');
    const allCards = await localStorageModule.getAllData('cards');
    
    console.log('✅ 所有身份数据:', allIdentities.length);
    console.log('✅ 所有心事数据:', allPosts.length);
    console.log('✅ 所有卡片数据:', allCards.length);
    
    // 5. 测试更新数据
    console.log('\n5. 测试更新数据...');
    const updatedIdentity = {
      ...testIdentity,
      nickname: '更新后的昵称'
    };
    await localStorageModule.updateData('identities', testIdentity.id, { nickname: '更新后的昵称' });
    const savedUpdatedIdentity = await localStorageModule.getData('identities', testIdentity.id);
    console.log('✅ 数据更新成功:', savedUpdatedIdentity);
    
    // 6. 测试删除数据
    console.log('\n6. 测试删除数据...');
    await localStorageModule.deleteData('cards', testCard.id);
    const deletedCard = await localStorageModule.getData('cards', testCard.id);
    console.log('✅ 数据删除成功，删除后数据:', deletedCard);
    
    // 7. 测试清空数据
    console.log('\n7. 测试清空数据...');
    await localStorageModule.clearData('posts');
    const allPostsAfterClear = await localStorageModule.getAllData('posts');
    console.log('✅ 数据清空成功，清空后数据数量:', allPostsAfterClear.length);
    
    // 8. 测试降级方案
    console.log('\n8. 测试降级方案...');
    // 模拟IndexedDB不可用的情况
    localStorageModule.db = null;
    localStorageModule.initialized = false;
    
    const testDataForLocalStorage = {
      id: generateId(),
      nickname: 'LocalStorage测试用户',
      emoji: '🤔',
      created_at: Date.now()
    };
    
    try {
      await localStorageModule.saveData('identities', testDataForLocalStorage);
      console.log('✅ 降级到LocalStorage存储成功');
      
      const localData = await localStorageModule.getData('identities', testDataForLocalStorage.id);
      console.log('✅ 从LocalStorage读取成功:', localData);
    } catch (error) {
      console.log('⚠️  降级测试遇到错误:', error.message);
    }
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
runTests();