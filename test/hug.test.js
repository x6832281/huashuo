import hugFeedbackModule from '../src/hug/hugFeedback.js';
import localStorageModule from '../src/storage/localStorage.js';

async function runTests() {
  console.log('开始测试拥抱反馈模块...\n');

  try {
    console.log('1. 测试批量拉取拥抱计数...');
    const shareIds = ['test-share-1', 'test-share-2'];
    const hugCounts = await hugFeedbackModule.fetchHugCounts(shareIds);
    console.log('✅ 批量拉取拥抱计数成功:', hugCounts);

    console.log('\n2. 测试检查新拥抱...');
    const oldCounts = [
      { share_id: 'test-share-1', hugs_count: 2 },
      { share_id: 'test-share-2', hugs_count: 5 }
    ];
    const newCounts = [
      { share_id: 'test-share-1', hugs_count: 4 },
      { share_id: 'test-share-2', hugs_count: 5 }
    ];
    const newHugs = hugFeedbackModule.checkNewHugs(oldCounts, newCounts);
    console.log('✅ 检查新拥抱成功:', newHugs);

    console.log('\n3. 测试获取回声页数据...');
    const echoData = await hugFeedbackModule.getEchoPageData();
    console.log('✅ 获取回声页数据成功，卡片数量:', echoData.length);

    console.log('\n4. 测试获取拥抱统计...');
    const statistics = await hugFeedbackModule.getHugStatistics();
    console.log('✅ 获取拥抱统计成功:', statistics);

    console.log('\n5. 测试通过share_id获取卡片...');
    const card = await hugFeedbackModule.getCardByShareId('test-share-1');
    console.log('✅ 通过share_id获取卡片:', card ? '成功' : '未找到');

    console.log('\n6. 测试拉取并更新拥抱计数...');
    const result = await hugFeedbackModule.fetchAndUpdateHugCounts();
    console.log('✅ 拉取并更新拥抱计数成功:', result);

    console.log('\n7. 测试本地增加拥抱数...');
    // 先创建一个测试卡片
    const testCard = {
      id: 'test-card-1',
      post_id: 'test-post-1',
      share_id: 'test-share-3',
      ai_poem: '测试诗句',
      sticker_comfort: '安慰文案',
      sticker_gossip: '吃瓜文案',
      sticker_roast: '损友文案',
      hugs_count: 0,
      created_at: Date.now()
    };
    await localStorageModule.saveData('cards', testCard);
    
    const updatedCard = await hugFeedbackModule.incrementHugLocally('test-card-1');
    console.log('✅ 本地增加拥抱数成功，当前拥抱数:', updatedCard?.hugs_count);

    console.log('\n8. 测试浏览器环境功能...');
    console.log('⚠️  显示拥抱提示功能需要在浏览器环境中测试');
    console.log('   请在浏览器中打开 test/browser-hug-test.html 进行测试');

    console.log('\n9. 测试错误处理...');
    const emptyResult = await hugFeedbackModule.fetchHugCounts([]);
    console.log('✅ 空数组处理成功:', emptyResult);

    console.log('\n10. 测试网络离线处理...');
    // 模拟离线状态
    const originalOnline = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    const offlineResult = await hugFeedbackModule.fetchHugCounts(shareIds);
    Object.defineProperty(navigator, 'onLine', { value: originalOnline, writable: true });
    console.log('✅ 离线状态处理成功:', offlineResult);

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

runTests();