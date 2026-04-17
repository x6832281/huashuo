import identityManagementModule from '../src/identity/identityManagement.js';

async function runTests() {
  console.log('开始测试身份管理模块...\n');

  try {
    console.log('1. 测试初始化和获取当前身份...');
    await identityManagementModule.getCurrentIdentity();
    console.log('✅ 初始化成功，当前身份创建/获取成功\n');

    console.log('2. 测试创建身份...');
    const identity1 = await identityManagementModule.createIdentity('小明', '😄');
    console.log('✅ 身份1创建成功:', identity1);
    const identity2 = await identityManagementModule.createIdentity('小红', '😊');
    console.log('✅ 身份2创建成功:', identity2);

    console.log('\n3. 测试获取身份列表...');
    const identities = await identityManagementModule.getIdentityList({ activeOnly: false });
    console.log('✅ 身份列表获取成功，共', identities.length, '个身份');

    console.log('\n4. 测试切换身份...');
    await identityManagementModule.switchIdentity(identity1.id);
    const currentIdentity = await identityManagementModule.getCurrentIdentity();
    console.log('✅ 切换到身份1成功，当前身份:', currentIdentity.nickname);
    await identityManagementModule.switchIdentity(identity2.id);
    const currentIdentity2 = await identityManagementModule.getCurrentIdentity();
    console.log('✅ 切换到身份2成功，当前身份:', currentIdentity2.nickname);

    console.log('\n5. 测试更新身份...');
    await identityManagementModule.switchIdentity(identity1.id);
    const updatedIdentity = await identityManagementModule.updateIdentity(identity1.id, { nickname: '小明更新' });
    console.log('✅ 身份1更新成功，新昵称:', updatedIdentity.nickname);

    console.log('\n6. 测试归档身份...');
    const archivedIdentity = await identityManagementModule.archiveIdentity(identity1.id);
    console.log('✅ 身份1归档成功，归档时间:', archivedIdentity.archived_at);
    const activeIdentities = await identityManagementModule.getIdentityList({ activeOnly: true });
    console.log('✅ 当前活跃身份数量:', activeIdentities.length);

    console.log('\n7. 测试验证归档限制（不能归档最后一个活跃身份）...');
    const activeList = await identityManagementModule.getIdentityList({ activeOnly: true });
    if (activeList.length === 1) {
      try {
        await identityManagementModule.archiveIdentity(activeList[0].id);
        console.log('❌ 应该抛出错误，但没有抛出');
      } catch (error) {
        console.log('✅ 正确抛出错误:', error.message);
      }
    } else {
      console.log('⚠️  当前有', activeList.length, '个活跃身份，跳过此测试');
    }

    console.log('\n8. 测试验证昵称长度限制...');
    try {
      await identityManagementModule.createIdentity('很长的昵称超过限制了', '😄');
      console.log('❌ 应该抛出错误，但没有抛出');
    } catch (error) {
      console.log('✅ 正确抛出错误:', error.message);
    }

    console.log('\n9. 测试验证Emoji格式...');
    try {
      await identityManagementModule.createIdentity('测试', 'abc');
      console.log('❌ 应该抛出错误，但没有抛出');
    } catch (error) {
      console.log('✅ 正确抛出错误:', error.message);
    }

    console.log('\n10. 测试删除已归档的身份...');
    const deleted = await identityManagementModule.deleteIdentity(identity1.id);
    console.log('✅ 身份1删除成功:', deleted);
    const identitiesAfterDelete = await identityManagementModule.getIdentityList({ activeOnly: false });
    console.log('✅ 删除后身份列表数量:', identitiesAfterDelete.length);

    console.log('\n11. 测试获取当前身份（验证身份隔离）...');
    const current = await identityManagementModule.getCurrentIdentity();
    console.log('✅ 当前身份:', current.nickname, current.emoji);

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

runTests();