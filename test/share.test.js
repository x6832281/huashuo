import shareFunctionalityModule from '../src/share/shareFunctionality.js';

async function runTests() {
  console.log('开始测试分享功能模块...\n');

  try {
    console.log('1. 测试生成分享链接...');
    const shareId = 'test-share-id-123';
    const shareLink = shareFunctionalityModule.generateShareLink(shareId);
    console.log('✅ 分享链接生成成功:', shareLink);

    console.log('\n2. 测试分享能力检测...');
    const capabilities = await shareFunctionalityModule.testShareCapabilities();
    console.log('✅ 分享能力检测结果:', capabilities);

    console.log('\n3. 测试获取分享方法...');
    const methods = shareFunctionalityModule.getShareMethods();
    console.log('✅ 可用的分享方法:', methods);

    console.log('\n4. 测试系统分享支持检测...');
    const isSystemShareSupported = shareFunctionalityModule.isShareSupported();
    console.log('✅ 系统分享支持:', isSystemShareSupported);

    console.log('\n5. 测试剪贴板支持检测...');
    const isClipboardSupported = shareFunctionalityModule.isClipboardSupported();
    console.log('✅ 剪贴板支持:', isClipboardSupported);

    console.log('\n6. 测试分享记录功能...');
    shareFunctionalityModule.recordShareAction('test-card-id', 'system');
    const records = await shareFunctionalityModule.getShareRecords('test-card-id');
    console.log('✅ 分享记录功能正常，记录数量:', records.length);

    console.log('\n7. 测试获取所有分享记录...');
    const allRecords = await shareFunctionalityModule.getShareRecords();
    console.log('✅ 所有分享记录数量:', allRecords.length);

    console.log('\n8. 测试兜底分享功能...');
    const cardData = {
      id: 'test-card-id',
      share_id: shareId,
      ai_poem: '测试诗句'
    };
    const fallbackResult = await shareFunctionalityModule.shareWithFallback(cardData, null);
    console.log('✅ 兜底分享结果:', fallbackResult);

    console.log('\n9. 测试浏览器环境功能...');
    console.log('⚠️  系统分享、图片保存和剪贴板功能需要在浏览器环境中测试');
    console.log('   请在浏览器中打开 test/browser-share-test.html 进行测试');

    console.log('\n10. 测试分享卡片功能...');
    const shareResult = await shareFunctionalityModule.shareCard(cardData, null);
    console.log('✅ 分享卡片结果:', shareResult);

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

runTests();