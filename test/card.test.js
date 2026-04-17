import cardGenerationModule from '../src/card/cardGeneration.js';
import aiTranslationModule from '../src/ai/aiTranslation.js';

async function runTests() {
  console.log('开始测试卡片生成模块...\n');

  try {
    console.log('1. 测试创建卡片...');
    const aiResult = await aiTranslationModule.translateText('今天心情很好！');
    const card = await cardGenerationModule.createCard('test-post-id', aiResult);
    console.log('✅ 卡片创建成功:', card.id);
    console.log('   分享ID:', card.share_id);
    console.log('   诗句:', card.ai_poem);

    console.log('\n2. 测试获取卡片...');
    const retrievedCard = await cardGenerationModule.getCard(card.id);
    console.log('✅ 卡片获取成功:', retrievedCard.id);

    console.log('\n3. 测试更新卡片...');
    const updatedCard = await cardGenerationModule.updateCard(card.id, {
      sticker_selected_type: 'gossip'
    });
    console.log('✅ 卡片更新成功，选中的表情包类型:', updatedCard.sticker_selected_type);

    console.log('\n4. 测试生成分享链接...');
    const shareLink = cardGenerationModule.generateShareLink(card.share_id);
    console.log('✅ 分享链接生成成功:', shareLink);

    console.log('\n5. 测试增加拥抱数...');
    const huggedCard = await cardGenerationModule.incrementHug(card.id);
    console.log('✅ 拥抱数增加成功，当前拥抱数:', huggedCard.hugs_count);

    console.log('\n6. 测试通过心事ID获取卡片...');
    const cardByPostId = await cardGenerationModule.getCardByPostId('test-post-id');
    console.log('✅ 通过心事ID获取卡片成功:', cardByPostId.id);

    console.log('\n7. 测试删除卡片...');
    const deletedCard = await cardGenerationModule.deleteCard(card.id);
    console.log('✅ 卡片删除成功，删除时间:', deletedCard.deleted_at);

    console.log('\n8. 测试卡片生成功能（浏览器环境）...');
    console.log('⚠️  Canvas相关功能需要在浏览器环境中测试');
    console.log('   请在浏览器中打开 test/browser-card-test.html 进行测试');

    console.log('\n9. 测试分享功能（浏览器环境）...');
    console.log('⚠️  分享功能需要在浏览器环境中测试');
    console.log('   请在浏览器中打开 test/browser-card-test.html 进行测试');

    console.log('\n10. 测试导出功能（浏览器环境）...');
    console.log('⚠️  导出功能需要在浏览器环境中测试');
    console.log('   请在浏览器中打开 test/browser-card-test.html 进行测试');

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

runTests();