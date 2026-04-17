import emotionTreeHoleModule from '../src/emotion/emotionTreeHole.js';
import identityManagementModule from '../src/identity/identityManagement.js';

async function runTests() {
  console.log('开始测试情绪树洞模块...\n');

  try {
    console.log('1. 测试初始化...');
    await identityManagementModule.getCurrentIdentity();
    console.log('✅ 初始化成功\n');

    console.log('2. 测试发布心事...');
    const result = await emotionTreeHoleModule.createPost('今天天气很好，心情不错！');
    const post = result.post;
    console.log('✅ 心事发布成功:', post.id);
    console.log('   情绪频段:', post.mood_band_final);
    console.log('   敏感信息检测:', result.sensitiveInfo.length > 0 ? '有敏感信息' : '无敏感信息');

    console.log('\n3. 测试获取心事列表...');
    const posts = await emotionTreeHoleModule.getPostList();
    console.log('✅ 心事列表获取成功，共', posts.length, '条心事');

    console.log('\n4. 测试获取心事详情...');
    const postDetail = await emotionTreeHoleModule.getPostDetail(post.id);
    console.log('✅ 心事详情获取成功:', postDetail.content_text);

    console.log('\n5. 测试编辑情绪频段...');
    const updatedPost = await emotionTreeHoleModule.editMoodBand(post.id, 2);
    console.log('✅ 情绪频段编辑成功，新频段:', updatedPost.mood_band_final);
    console.log('   编辑次数:', updatedPost.mood_band_edit_count);

    console.log('\n6. 测试情绪频段编辑限制...');
    try {
      await emotionTreeHoleModule.editMoodBand(post.id, 0);
      console.log('❌ 应该抛出错误，但没有抛出');
    } catch (error) {
      console.log('✅ 正确抛出错误:', error.message);
    }

    console.log('\n7. 测试心事归档...');
    const archivedPost = await emotionTreeHoleModule.archivePost(post.id);
    console.log('✅ 心事归档成功，归档时间:', archivedPost.archived_at);

    console.log('\n8. 测试按归档状态筛选...');
    const activePosts = await emotionTreeHoleModule.getPostList({ archived: false });
    const archivedPosts = await emotionTreeHoleModule.getPostList({ archived: true });
    console.log('✅ 活跃心事数量:', activePosts.length);
    console.log('✅ 归档心事数量:', archivedPosts.length);

    console.log('\n9. 测试按情绪频段筛选...');
    const moodPosts = await emotionTreeHoleModule.getPostList({ moodBand: 2 });
    console.log('✅ 情绪频段为2的心事数量:', moodPosts.length);

    console.log('\n10. 测试心事恢复...');
    const restoredPost = await emotionTreeHoleModule.restorePost(post.id);
    console.log('✅ 心事恢复成功，归档时间:', restoredPost.archived_at);

    console.log('\n11. 测试心事删除...');
    const deletedPost = await emotionTreeHoleModule.deletePost(post.id);
    console.log('✅ 心事删除成功，删除时间:', deletedPost.deleted_at);

    console.log('\n12. 测试内容验证...');
    try {
      await emotionTreeHoleModule.createPost('');
      console.log('❌ 应该抛出错误，但没有抛出');
    } catch (error) {
      console.log('✅ 正确抛出错误:', error.message);
    }

    console.log('\n13. 测试内容长度限制...');
    try {
      await emotionTreeHoleModule.createPost('a'.repeat(1001));
      console.log('❌ 应该抛出错误，但没有抛出');
    } catch (error) {
      console.log('✅ 正确抛出错误:', error.message);
    }

    console.log('\n14. 测试敏感信息检测...');
    const sensitiveResult = await emotionTreeHoleModule.createPost('我的手机号是13800138000，邮箱是test@example.com');
    console.log('✅ 敏感信息检测:', sensitiveResult.sensitiveInfo.length > 0 ? '检测到敏感信息' : '未检测到敏感信息');

    console.log('\n15. 测试获取心事数量...');
    const count = await emotionTreeHoleModule.getPostCount();
    console.log('✅ 心事总数:', count);

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

runTests();