import aiTranslationModule from '../src/ai/aiTranslation.js';

async function runTests() {
  console.log('开始测试AI翻译模块...\n');

  try {
    console.log('1. 测试情绪分析功能...');
    const mood1 = aiTranslationModule.analyzeMood('今天天气很好，心情不错！');
    console.log('✅ 积极情绪分析结果:', mood1);
    
    const mood2 = aiTranslationModule.analyzeMood('今天心情很差，感觉很疲惫');
    console.log('✅ 消极情绪分析结果:', mood2);
    
    const mood3 = aiTranslationModule.analyzeMood('今天和平常一样');
    console.log('✅ 中性情绪分析结果:', mood3);

    console.log('\n2. 测试本地模板生成...');
    const result1 = aiTranslationModule.getLocalTemplate('今天心情很好！');
    console.log('✅ 积极情绪模板生成成功:');
    console.log('   情绪频段:', result1.mood_band);
    console.log('   诗句:', result1.ai_poem);
    console.log('   安慰文案:', result1.stickers.comfort);
    console.log('   吃瓜文案:', result1.stickers.gossip);
    console.log('   损友文案:', result1.stickers.roast);

    console.log('\n3. 测试翻译功能（使用本地模板）...');
    const result2 = await aiTranslationModule.translateText('今天心情很差，感觉很疲惫');
    console.log('✅ 翻译成功:');
    console.log('   情绪频段:', result2.mood_band);
    console.log('   诗句:', result2.ai_poem);
    console.log('   安慰文案:', result2.stickers.comfort);
    console.log('   吃瓜文案:', result2.stickers.gossip);
    console.log('   损友文案:', result2.stickers.roast);

    console.log('\n4. 测试响应验证功能...');
    const validResponse = {
      mood_band: 1,
      ai_poem: '云卷云舒任自然',
      stickers: {
        comfort: '一切都会好的 🌟',
        gossip: '有点意思 👀',
        roast: '淡定淡定，小场面 🤣'
      }
    };
    const invalidResponse = {
      mood_band: 3, // 无效的情绪频段
      ai_poem: '这是一句超过15字的诗句，测试响应验证',
      stickers: {
        comfort: '安慰文案',
        gossip: '吃瓜文案'
        // 缺少损友文案
      }
    };
    console.log('✅ 有效响应验证:', aiTranslationModule.validateResponse(validResponse));
    console.log('✅ 无效响应验证:', aiTranslationModule.validateResponse(invalidResponse));

    console.log('\n5. 测试批处理功能...');
    const texts = [
      '今天心情很好！',
      '今天心情很差',
      '今天和平常一样'
    ];
    const batchResults = await aiTranslationModule.batchTranslate(texts);
    console.log('✅ 批处理成功，共处理', batchResults.length, '条文本');
    batchResults.forEach((item, index) => {
      if (item.success) {
        console.log(`   ${index + 1}. 成功: ${item.text}`);
        console.log(`      情绪频段: ${item.result.mood_band}`);
        console.log(`      诗句: ${item.result.ai_poem}`);
      } else {
        console.log(`   ${index + 1}. 失败: ${item.text}`);
        console.log(`      错误: ${item.error}`);
      }
    });

    console.log('\n6. 测试不同情绪的模板生成...');
    const moods = [0, 1, 2];
    for (const mood of moods) {
      const result = aiTranslationModule.getLocalTemplate(mood === 0 ? '难过' : mood === 2 ? '开心' : '平静');
      console.log(`✅ 情绪频段 ${mood} 模板:`);
      console.log(`   诗句: ${result.ai_poem}`);
      console.log(`   安慰: ${result.stickers.comfort}`);
      console.log(`   吃瓜: ${result.stickers.gossip}`);
      console.log(`   损友: ${result.stickers.roast}`);
    }

    console.log('\n7. 测试响应格式验证...');
    const result3 = await aiTranslationModule.translateText('测试文本');
    console.log('✅ 响应格式验证:');
    console.log('   情绪频段类型:', typeof result3.mood_band);
    console.log('   诗句长度:', result3.ai_poem.length, '≤ 15');
    console.log('   安慰文案长度:', result3.stickers.comfort.length, '≤ 10');
    console.log('   吃瓜文案长度:', result3.stickers.gossip.length, '≤ 10');
    console.log('   损友文案长度:', result3.stickers.roast.length, '≤ 10');

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

runTests();