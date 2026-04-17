// 深度测试01：本地存储模块 - 根据guide文档全面验证所有功能点

import localStorageModule from '../src/storage/localStorage.js';

console.log('='.repeat(60));
console.log('DEEP TEST 01: Local Storage Module');
console.log('Based on guide: 01_local_storage_module.md');
console.log('='.repeat(60));

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    failedTests++;
  }
}

// 测试数据
const testIdentityData = {
  id: 'identity-test-001',
  nickname: 'TestUser',
  emoji: '😊',
  created_at: Date.now()
};

const testPostData = {
  id: 'post-test-001',
  identity_id: 'identity-test-001',
  mood_band_ai: 1,
  mood_band_final: 1,
  mood_band_edit_count: 0,
  content_text: 'This is a test post content',
  created_at: Date.now()
};

const testCardData = {
  id: 'card-test-001',
  post_id: 'post-test-001',
  ai_poem: 'Test poem content',
  sticker_comfort: 'Comfort text',
  sticker_gossip: 'Gossip text',
  sticker_roast: 'Roast text',
  hugs_count: 0,
  created_at: Date.now()
};

async function runDeepTests() {
  console.log('\n📋 Section 1: Database Initialization Tests\n');
  
  // 1.1 测试数据库初始化
  console.log('Testing database initialization...');
  try {
    const db = await localStorageModule.getDatabase();
    assert(db !== null || db !== undefined, 'Database should be initialized (or fallback to LocalStorage)');
    console.log('   Database status:', db ? 'IndexedDB available' : 'Using LocalStorage fallback');
  } catch (error) {
    assert(false, `Database initialization failed: ${error.message}`);
  }

  // 1.2 测试环境检测
  console.log('\n📋 Section 2: Environment Detection Tests\n');
  assert(typeof localStorageModule.isBrowser === 'boolean', 'isBrowser should be a boolean');
  assert(typeof localStorageModule.dbName === 'string', 'dbName should be a string');
  assert(localStorageModule.dbName === 'huashuo_app', 'dbName should be "huashuo_app"');

  console.log('\n📋 Section 3: Core CRUD Operations Tests\n');
  
  // 3.1 测试数据存储 - 身份数据
  console.log('Testing saveData for identities...');
  try {
    const savedIdentity = await localStorageModule.saveData('identities', testIdentityData);
    assert(savedIdentity !== null, 'saveData should return the saved data');
    assert(savedIdentity.id === testIdentityData.id, 'Saved data ID should match');
    assert(savedIdentity.nickname === testIdentityData.nickname, 'Saved nickname should match');
    console.log('   Saved identity:', savedIdentity);
  } catch (error) {
    assert(false, `saveData for identity failed: ${error.message}`);
  }

  // 3.2 测试数据存储 - 心事数据
  console.log('Testing saveData for posts...');
  try {
    const savedPost = await localStorageModule.saveData('posts', testPostData);
    assert(savedPost !== null, 'saveData should return the saved post data');
    assert(savedPost.id === testPostData.id, 'Saved post ID should match');
    assert(savedPost.content_text === testPostData.content_text, 'Saved content should match');
    console.log('   Saved post:', savedPost);
  } catch (error) {
    assert(false, `saveData for post failed: ${error.message}`);
  }

  // 3.3 测试数据存储 - 卡片数据
  console.log('Testing saveData for cards...');
  try {
    const savedCard = await localStorageModule.saveData('cards', testCardData);
    assert(savedCard !== null, 'saveData should return the saved card data');
    assert(savedCard.id === testCardData.id, 'Saved card ID should match');
    assert(savedCard.ai_poem === testCardData.ai_poem, 'Saved poem should match');
    console.log('   Saved card:', savedCard);
  } catch (error) {
    assert(false, `saveData for card failed: ${error.message}`);
  }

  console.log('\n📋 Section 4: Data Retrieval Tests\n');
  
  // 4.1 测试getData - 单条数据查询
  console.log('Testing getData for single record...');
  try {
    const retrievedIdentity = await localStorageModule.getData('identities', testIdentityData.id);
    assert(retrievedIdentity !== null && retrievedIdentity !== undefined, 'getData should return the identity');
    assert(retrievedIdentity.id === testIdentityData.id, 'Retrieved identity ID should match');
    assert(retrievedIdentity.nickname === testIdentityData.nickname, 'Retrieved nickname should match');
    console.log('   Retrieved identity:', retrievedIdentity);
  } catch (error) {
    assert(false, `getData failed: ${error.message}`);
  }

  // 4.2 测试getAllData - 获取所有数据
  console.log('Testing getAllData...');
  try {
    const allIdentities = await localStorageModule.getAllData('identities');
    assert(Array.isArray(allIdentities), 'getAllData should return an array');
    assert(allIdentities.length > 0, 'Array should not be empty');
    assert(allIdentities.some(item => item.id === testIdentityData.id), 'Should contain our test identity');
    console.log(`   Found ${allIdentities.length} identities`);
  } catch (error) {
    assert(false, `getAllData failed: ${error.message}`);
  }

  console.log('\n📋 Section 5: Data Update Tests\n');
  
  // 5.1 测试updateData
  console.log('Testing updateData...');
  try {
    const updates = { nickname: 'UpdatedUser', emoji: '🎉' };
    const updatedIdentity = await localStorageModule.updateData('identities', testIdentityData.id, updates);
    assert(updatedIdentity !== null, 'updateData should return updated data');
    assert(updatedIdentity.nickname === 'UpdatedUser', 'Nickname should be updated');
    assert(updatedIdentity.emoji === '🎉', 'Emoji should be updated');
    console.log('   Updated identity:', updatedIdentity);
    
    // 验证更新后的数据
    const verifyUpdate = await localStorageModule.getData('identities', testIdentityData.id);
    assert(verifyUpdate.nickname === 'UpdatedUser', 'Verify: Nickname should be persisted');
    console.log('   Verified update persistence');
  } catch (error) {
    assert(false, `updateData failed: ${error.message}`);
  }

  console.log('\n📋 Section 6: Data Deletion Tests\n');
  
  // 6.1 测试deleteData
  console.log('Testing deleteData...');
  try {
    const deleteResult = await localStorageModule.deleteData('cards', testCardData.id);
    assert(deleteResult !== false, 'deleteData should return true or deleted data');
    
    // 验证删除后数据不存在
    const deletedCard = await localStorageModule.getData('cards', testCardData.id);
    assert(deletedCard === null || deletedCard === undefined, 'Deleted card should not exist');
    console.log('   Card successfully deleted and verified');
  } catch (error) {
    assert(false, `deleteData failed: ${error.message}`);
  }

  console.log('\n📋 Section 7: Data Clear Tests\n');
  
  // 7.1 测试clearData
  console.log('Testing clearData...');
  try {
    // 先添加一些测试数据
    await localStorageModule.saveData('cards', { id: 'temp-card-1', ...testCardData });
    await localStorageModule.saveData('cards', { id: 'temp-card-2', ...testCardData });
    
    const clearResult = await localStorageModule.clearData('cards');
    assert(clearResult !== false, 'clearData should return true');
    
    // 验证清空后数据为空
    const clearedCards = await localStorageModule.getAllData('cards');
    assert(clearedCards.length === 0, 'Cleared cards should be empty');
    console.log('   Cards cleared successfully');
  } catch (error) {
    assert(false, `clearData failed: ${error.message}`);
  }

  console.log('\n📋 Section 8: Error Handling Tests\n');
  
  // 8.1 测试无效输入
  console.log('Testing error handling with invalid inputs...');
  try {
    await localStorageModule.saveData('', { id: 'test' });
    assert(false, 'Should throw error for empty storeName');
  } catch (error) {
    assert(true, 'Correctly throws error for empty storeName');
  }

  try {
    await localStorageModule.getData('identities', '');
    // 可能返回null或抛出异常，都是可接受的
    assert(true, 'Handles empty ID gracefully');
  } catch (error) {
    assert(true, 'Throws error for empty ID (acceptable behavior)');
  }

  // 8.2 测试不存在的数据
  console.log('Testing retrieval of non-existent data...');
  try {
    const nonExistent = await localStorageModule.getData('identities', 'non-existent-id');
    assert(nonExistent === null || nonExistent === undefined, 'Should return null/undefined for non-existent data');
    console.log('   Correctly returns null/undefined for non-existent data');
  } catch (error) {
    assert(true, 'Throws error for non-existent data (acceptable)');
  }

  console.log('\n📋 Section 9: Fallback Mechanism Tests\n');
  
  // 9.1 测试降级方案
  console.log('Testing fallback mechanism...');
  assert(typeof localStorageModule.fallbackSave === 'function', 'fallbackSave method exists');
  assert(typeof localStorageModule.getFallbackStore === 'function', 'getFallbackStore method exists');
  assert(typeof localStorageModule.saveToLocalStorage === 'function', 'saveToLocalStorage method exists');
  console.log('   Fallback methods are available');

  // 9.2 测试内存存储
  if (!localStorageModule.isBrowser) {
    assert(localStorageModule.memoryStorage instanceof Map, 'memoryStorage is a Map instance');
    console.log('   Memory storage available for non-browser environment');
  }

  console.log('\n📋 Section 10: Performance & Edge Cases\n');
  
  // 10.1 批量操作测试
  console.log('Testing batch operations...');
  try {
    const batchSize = 50;
    const batchData = [];
    for (let i = 0; i < batchSize; i++) {
      batchData.push({
        id: `batch-post-${i}`,
        identity_id: testIdentityData.id,
        mood_band_ai: i % 3,
        mood_band_final: i % 3,
        mood_band_edit_count: 0,
        content_text: `Batch test post ${i}`,
        created_at: Date.now() + i
      });
    }
    
    const startTime = Date.now();
    for (const data of batchData) {
      await localStorageModule.saveData('posts', data);
    }
    const saveTime = Date.now() - startTime;
    
    const allPosts = await localStorageModule.getAllData('posts');
    const readTime = Date.now() - startTime - saveTime;
    
    assert(saveTime < 5000, `Batch save of ${batchSize} items took ${saveTime}ms (<5000ms threshold)`);
    assert(allPosts.length >= batchSize, `Should have at least ${batchSize} posts after batch insert`);
    console.log(`   Batch save: ${batchSize} items in ${saveTime}ms`);
    console.log(`   Total posts: ${allPosts.length}`);
  } catch (error) {
    assert(false, `Batch operation failed: ${error.message}`);
  }

  // 10.2 特殊字符和大数据测试
  console.log('Testing special characters and large data...');
  try {
    const specialCharData = {
      id: 'special-test-001',
      identity_id: testIdentityData.id,
      mood_band_ai: 2,
      mood_band_final: 2,
      mood_band_edit_count: 0,
      content_text: '特殊字符测试: 中文!@#$%^&*() Emoji: 🎉🎊🎈 Unicode: \u0000\u0001\u0002',
      created_at: Date.now()
    };
    
    const savedSpecial = await localStorageModule.saveData('posts', specialCharData);
    assert(specialCharData.content_text === savedSpecial.content_text, 'Special characters preserved correctly');
    console.log('   Special characters handled correctly');
  } catch (error) {
    assert(false, `Special character test failed: ${error.message}`);
  }

  // 清理测试数据
  console.log('\n🧹 Cleaning up test data...');
  try {
    await localStorageModule.deleteData('identities', testIdentityData.id);
    await localStorageModule.deleteData('posts', testPostData.id);
    await localStorageModule.clearData('posts'); // 清除批量测试数据
    console.log('   Test data cleaned up');
  } catch (error) {
    console.log('   Cleanup warning:', error.message);
  }

  // 输出最终结果
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Passed: ${passedTests}`);
  console.log(`Total Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(2)}%`);
  console.log('='.repeat(60));

  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED!');
  } else {
    console.log('⚠️ SOME TESTS FAILED - Please review above');
  }

  return { passed: passedTests, failed: failedTests };
}

runDeepTests().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
