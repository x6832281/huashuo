# 身份管理模块使用说明

## 1. 模块介绍

身份管理模块（Identity Management Module）是话说APP的核心模块之一，提供用户身份的创建、切换、管理功能，确保不同身份的数据严格隔离。

### 核心特性

- **身份创建**：创建新的用户身份
- **身份切换**：在不同身份之间切换
- **身份列表**：展示所有已创建的身份
- **身份归档**：将不常用的身份归档
- **身份清理**：删除已归档的身份及其数据
- **默认身份**：首次进入应用时自动创建默认身份
- **身份隔离**：不同身份的数据严格隔离

## 2. 安装方法

### 2.1 引入模块

在 Node.js 环境中：

```javascript
const identityManagementModule = require('./src/identity/identityManagement');
```

在浏览器环境中：

```html
<script src="path/to/identityManagement.js"></script>
```

### 2.2 依赖模块

身份管理模块依赖于本地存储模块：

```javascript
const localStorageModule = require('./src/storage/localStorage');
```

## 3. 核心功能使用

### 3.1 创建身份

```javascript
const identity = await identityManagementModule.createIdentity('小明', '😄');
console.log('身份创建成功:', identity);
```

**参数说明**：
- `nickname`：昵称，长度2-8个字符（中文按2个字符计算）
- `emoji`：表情符号

**返回**：创建的身份对象

**抛出错误**：
- 昵称为空
- 昵称长度不符合要求
- Emoji格式无效

### 3.2 获取身份

```javascript
const identity = await identityManagementModule.getIdentity(identityId);
console.log('身份信息:', identity);
```

**参数说明**：
- `identityId`：身份的唯一标识符

**返回**：身份对象

**抛出错误**：
- 身份ID无效
- 身份不存在

### 3.3 切换身份

```javascript
const identity = await identityManagementModule.switchIdentity(identityId);
console.log('已切换到身份:', identity.nickname);
```

**参数说明**：
- `identityId`：要切换到的身份ID

**返回**：切换后的身份对象

**抛出错误**：
- 身份ID无效
- 身份不存在
- 尝试切换到已归档的身份

### 3.4 获取当前身份

```javascript
const identity = await identityManagementModule.getCurrentIdentity();
console.log('当前身份:', identity.nickname, identity.emoji);
```

**返回**：当前活跃的身份对象

**说明**：
- 如果没有当前身份，自动创建一个默认身份
- 如果当前身份已被归档，自动切换到其他活跃身份

### 3.5 获取身份列表

```javascript
// 获取所有活跃身份
const activeIdentities = await identityManagementModule.getIdentityList({ activeOnly: true });
console.log('活跃身份数量:', activeIdentities.length);

// 获取所有身份（包括归档）
const allIdentities = await identityManagementModule.getIdentityList({ activeOnly: false });
console.log('身份总数:', allIdentities.length);
```

**参数说明**：
- `activeOnly`：是否只返回活跃身份（默认 true）

**返回**：身份数组，按创建时间倒序排列

### 3.6 更新身份

```javascript
const updatedIdentity = await identityManagementModule.updateIdentity(identityId, {
  nickname: '新昵称',
  emoji: '😊'
});
console.log('身份已更新:', updatedIdentity.nickname);
```

**参数说明**：
- `identityId`：要更新的身份ID
- `updates`：要更新的属性（可选 nickname 或 emoji）

**返回**：更新后的身份对象

**抛出错误**：
- 身份不存在
- 尝试更新已归档的身份

### 3.7 归档身份

```javascript
const archivedIdentity = await identityManagementModule.archiveIdentity(identityId);
console.log('身份已归档，归档时间:', archivedIdentity.archived_at);
```

**参数说明**：
- `identityId`：要归档的身份ID

**返回**：归档后的身份对象

**抛出错误**：
- 身份不存在
- 身份已经归档
- 尝试归档最后一个活跃身份

### 3.8 删除身份

```javascript
const deleted = await identityManagementModule.deleteIdentity(identityId);
console.log('身份删除成功:', deleted);
```

**参数说明**：
- `identityId`：要删除的身份ID

**返回**：true（删除成功）

**抛出错误**：
- 身份不存在
- 尝试删除未归档的身份

## 4. 数据结构

### 身份对象

```javascript
interface Identity {
  id: string;           // 唯一标识符
  nickname: string;     // 昵称
  emoji: string;        // 表情
  created_at: number;   // 创建时间戳
  archived_at: number | null; // 归档时间戳（null 表示未归档）
}
```

### 身份示例

```javascript
{
  id: "mo2s8kwwuacezm3pr0l",
  nickname: "小明",
  emoji: "😄",
  created_at: 1776422748128,
  archived_at: null
}
```

## 5. 业务规则

### 5.1 昵称规则

- 长度：2-8个字符
- 支持：中文、英文、数字
- 验证：自动去除前后空格后验证

### 5.2 Emoji规则

- 必须选择一个有效的 Emoji 表情
- 支持常见的 Emoji 表情符号

### 5.3 身份隔离

- 不同身份的数据严格隔离
- 切换身份后只能访问当前身份的数据
- 存储时自动关联当前身份

### 5.4 归档限制

- 至少保留一个活跃身份
- 已归档的身份无法切换
- 已归档的身份可以删除

## 6. 错误处理

模块内置了完善的错误处理机制：

```javascript
try {
  const identity = await identityManagementModule.createIdentity('小明', '😄');
  console.log('身份创建成功:', identity);
} catch (error) {
  console.error('创建身份失败:', error.message);
}
```

### 常见错误

| 错误信息 | 说明 |
|---------|------|
| 昵称不能为空 | 昵称为空或仅包含空格 |
| 昵称长度必须在2-8个字符之间 | 昵称长度不符合要求 |
| 请选择一个有效的Emoji表情 | Emoji格式无效 |
| 身份不存在 | 指定的身份ID不存在 |
| 无法切换到已归档的身份 | 尝试切换到已归档的身份 |
| 该身份已经归档 | 尝试重复归档身份 |
| 至少需要保留一个活跃身份 | 尝试归档最后一个活跃身份 |
| 只能删除已归档的身份 | 尝试删除未归档的身份 |

## 7. 浏览器兼容性

| 浏览器 | 版本要求 | 支持状态 |
|--------|---------|----------|
| Chrome | 60+ | ✅ 完全支持 |
| Firefox | 55+ | ✅ 完全支持 |
| Safari | 12+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |

## 8. 完整示例

### 8.1 Node.js 环境示例

```javascript
const identityManagementModule = require('./src/identity/identityManagement');

async function runExample() {
    try {
        // 1. 获取当前身份（如果没有会自动创建）
        console.log('1. 获取当前身份...');
        const current = await identityManagementModule.getCurrentIdentity();
        console.log('✅ 当前身份:', current.nickname, current.emoji);

        // 2. 创建新身份
        console.log('\n2. 创建新身份...');
        const newIdentity = await identityManagementModule.createIdentity('小明', '😄');
        console.log('✅ 新身份创建成功:', newIdentity);

        // 3. 切换身份
        console.log('\n3. 切换身份...');
        await identityManagementModule.switchIdentity(newIdentity.id);
        const switched = await identityManagementModule.getCurrentIdentity();
        console.log('✅ 已切换到身份:', switched.nickname);

        // 4. 获取身份列表
        console.log('\n4. 获取身份列表...');
        const identities = await identityManagementModule.getIdentityList({ activeOnly: true });
        console.log('✅ 活跃身份数量:', identities.length);

        // 5. 更新身份
        console.log('\n5. 更新身份...');
        const updated = await identityManagementModule.updateIdentity(newIdentity.id, { nickname: '大明' });
        console.log('✅ 身份已更新，新昵称:', updated.nickname);

        // 6. 归档身份
        console.log('\n6. 归档身份...');
        const archived = await identityManagementModule.archiveIdentity(newIdentity.id);
        console.log('✅ 身份已归档');

        // 7. 删除身份
        console.log('\n7. 删除身份...');
        const deleted = await identityManagementModule.deleteIdentity(newIdentity.id);
        console.log('✅ 身份已删除');

    } catch (error) {
        console.error('❌ 发生错误:', error.message);
    }
}

runExample();
```

### 8.2 浏览器环境示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>身份管理模块示例</title>
</head>
<body>
    <h1>身份管理模块示例</h1>
    <div id="result"></div>

    <script src="src/storage/localStorage.js"></script>
    <script src="src/identity/identityManagement.js"></script>
    <script>
        async function runExample() {
            const resultDiv = document.getElementById('result');

            try {
                // 1. 获取当前身份
                resultDiv.innerHTML += '<p>1. 获取当前身份...</p>';
                const current = await identityManagementModule.getCurrentIdentity();
                resultDiv.innerHTML += `<p>✅ 当前身份: ${current.nickname} ${current.emoji}</p>`;

                // 2. 创建新身份
                resultDiv.innerHTML += '<p>2. 创建新身份...</p>';
                const newIdentity = await identityManagementModule.createIdentity('小明', '😄');
                resultDiv.innerHTML += `<p>✅ 新身份创建成功: ${newIdentity.nickname} ${newIdentity.emoji}</p>`;

                // 3. 切换身份
                resultDiv.innerHTML += '<p>3. 切换身份...</p>';
                await identityManagementModule.switchIdentity(newIdentity.id);
                const switched = await identityManagementModule.getCurrentIdentity();
                resultDiv.innerHTML += `<p>✅ 已切换到身份: ${switched.nickname} ${switched.emoji}</p>`;

                // 4. 获取身份列表
                resultDiv.innerHTML += '<p>4. 获取身份列表...</p>';
                const identities = await identityManagementModule.getIdentityList({ activeOnly: true });
                resultDiv.innerHTML += `<p>✅ 活跃身份数量: ${identities.length}</p>`;

            } catch (error) {
                resultDiv.innerHTML += `<p>❌ 发生错误: ${error.message}</p>`;
            }
        }

        runExample();
    </script>
</body>
</html>
```

## 9. 注意事项

1. **身份隔离**：切换身份后，所有数据操作都针对当前身份
2. **归档限制**：至少保留一个活跃身份，不能归档所有身份
3. **删除限制**：只能删除已归档的身份，未归档身份需要先归档再删除
4. **数据安全**：删除身份会永久删除该身份的所有数据，请谨慎操作
5. **默认身份**：首次使用时会自动创建一个默认身份（昵称"我"，表情"😊"）

## 10. 总结

身份管理模块提供了完整的身份管理功能，包括创建、切换、列表、更新、归档和删除操作。通过严格的业务规则和数据隔离机制，确保用户可以在同一个应用中管理多个身份，每个身份的数据相互独立。

该模块符合需求文档中的设计要求，为整个应用的正常运行提供了用户身份管理能力。