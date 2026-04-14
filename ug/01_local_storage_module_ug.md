# 本地存储模块使用说明

## 1. 模块介绍

本地存储模块（Local Storage Module）是一个基于浏览器IndexedDB的本地数据存储解决方案，为应用提供可靠的数据持久化能力。该模块支持多层降级方案，确保在各种环境下都能正常工作。

### 核心特性
- **多层存储方案**：IndexedDB（主要） + LocalStorage（降级） + 内存存储（最后降级）
- **完整的CRUD操作**：支持数据的存储、读取、更新、删除和清空
- **自动降级**：当IndexedDB不可用时，自动降级到LocalStorage或内存存储
- **错误处理**：完善的错误处理机制，确保操作稳定性
- **离线支持**：支持离线访问和数据持久化

## 2. 安装方法

### 2.1 直接引入（浏览器环境）

将 `localStorage.js` 文件复制到项目中，然后在HTML文件中引入：

```html
<script src="path/to/localStorage.js"></script>
<script>
  // 使用localStorageModule全局变量
  await localStorageModule.initDatabase();
</script>
```

### 2.2 Node.js环境

在Node.js环境中，使用require引入：

```javascript
const localStorageModule = require('./src/storage/localStorage');
```

## 3. 核心功能使用

### 3.1 初始化数据库

在使用任何存储操作之前，需要先初始化数据库：

```javascript
// 初始化数据库
await localStorageModule.initDatabase();
console.log('数据库初始化成功');
```

### 3.2 存储数据

```javascript
// 存储身份数据
const identity = {
  id: '123',
  nickname: '测试用户',
  emoji: '😊',
  created_at: Date.now()
};

await localStorageModule.saveData('identities', identity);
console.log('数据存储成功');

// 存储心事数据
const post = {
  id: '456',
  identity_id: '123',
  mood_band_ai: 5,
  mood_band_final: 5,
  mood_band_edit_count: 0,
  content_text: '这是一条测试心事',
  created_at: Date.now()
};

await localStorageModule.saveData('posts', post);
console.log('心事数据存储成功');

// 存储卡片数据
const card = {
  id: '789',
  post_id: '456',
  ai_poem: '测试诗句',
  sticker_comfort: '安慰文案',
  sticker_gossip: '吃瓜文案',
  sticker_roast: '损友文案',
  hugs_count: 0,
  created_at: Date.now()
};

await localStorageModule.saveData('cards', card);
console.log('卡片数据存储成功');
```

### 3.3 读取数据

```javascript
// 读取身份数据
const identity = await localStorageModule.getData('identities', '123');
console.log('读取的身份数据:', identity);

// 读取心事数据
const post = await localStorageModule.getData('posts', '456');
console.log('读取的心事数据:', post);

// 读取卡片数据
const card = await localStorageModule.getData('cards', '789');
console.log('读取的卡片数据:', card);
```

### 3.4 读取所有数据

```javascript
// 读取所有身份数据
const identities = await localStorageModule.getAllData('identities');
console.log('所有身份数据:', identities);

// 读取所有心事数据
const posts = await localStorageModule.getAllData('posts');
console.log('所有心事数据:', posts);

// 读取所有卡片数据
const cards = await localStorageModule.getAllData('cards');
console.log('所有卡片数据:', cards);
```

### 3.5 更新数据

```javascript
// 更新身份数据
await localStorageModule.updateData('identities', '123', {
  nickname: '更新后的昵称'
});

// 验证更新结果
const updatedIdentity = await localStorageModule.getData('identities', '123');
console.log('更新后的身份数据:', updatedIdentity);
```

### 3.6 删除数据

```javascript
// 删除卡片数据
await localStorageModule.deleteData('cards', '789');
console.log('卡片数据删除成功');

// 验证删除结果
const deletedCard = await localStorageModule.getData('cards', '789');
console.log('删除后的卡片数据:', deletedCard); // 应该返回null
```

### 3.7 清空数据

```javascript
// 清空心事数据
await localStorageModule.clearData('posts');
console.log('心事数据清空成功');

// 验证清空结果
const postsAfterClear = await localStorageModule.getAllData('posts');
console.log('清空后的心事数据数量:', postsAfterClear.length); // 应该返回0
```

## 4. 数据结构

### 4.1 身份数据

```javascript
interface Identity {
  id: string;           // 唯一标识符
  nickname: string;     // 昵称
  emoji: string;        // 表情
  created_at: number;   // 创建时间戳
}
```

### 4.2 心事数据

```javascript
interface Post {
  id: string;                  // 唯一标识符
  identity_id: string;         // 所属身份ID
  mood_band_ai: number;        // AI建议的情绪频段
  mood_band_final: number;     // 最终情绪频段（用户可纠错）
  mood_band_edit_count: number; // 频段编辑次数（0或1）
  content_text: string;        // 心事内容
  created_at: number;          // 创建时间戳
  archived_at?: number;        // 归档时间戳（可选）
  deleted_at?: number;         // 删除时间戳（可选）
}
```

### 4.3 卡片数据

```javascript
interface Card {
  id: string;                // 唯一标识符
  post_id: string;           // 所属心事ID
  share_id?: string;         // 分享ID（可选）
  ai_poem: string;           // AI生成的诗句
  sticker_comfort: string;   // 安慰表情包文案
  sticker_gossip: string;    // 吃瓜表情包文案
  sticker_roast: string;     // 损友式诋毁表情包文案
  sticker_selected_type?: string; // 选中的表情包类型（可选）
  hugs_count: number;        // 拥抱数
  created_at: number;        // 创建时间戳
  exported_at?: number;      // 导出时间戳（可选）
  synced_at?: number;        // 同步时间戳（可选）
}
```

## 5. 错误处理

模块内置了完善的错误处理机制，当遇到错误时会自动降级到其他存储方案：

```javascript
try {
  // 尝试存储数据
  await localStorageModule.saveData('identities', identity);
  console.log('数据存储成功');
} catch (error) {
  console.error('存储数据时发生错误:', error);
  // 即使发生错误，模块也会尝试降级到其他存储方案
}
```

## 6. 降级方案

模块支持三层降级方案：

1. **IndexedDB**：主要存储方案，支持大量数据存储
2. **LocalStorage**：当IndexedDB不可用时的降级方案，存储容量较小
3. **内存存储**：当浏览器环境不可用时的最后降级方案，数据仅在会话期间有效

## 7. 浏览器兼容性

| 浏览器 | 版本要求 | 支持状态 |
|--------|---------|----------|
| Chrome | 60+ | ✅ 完全支持 |
| Firefox | 55+ | ✅ 完全支持 |
| Safari | 12+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |

## 8. 性能优化

### 8.1 存储大量数据

当需要存储大量数据时，建议：
- 分批存储，避免一次性存储过多数据
- 定期清理过期数据，保持存储空间充足
- 使用索引提高查询性能

### 8.2 读取性能

- 只读取必要的数据，避免获取全部数据
- 使用适当的查询条件，减少数据传输量
- 考虑使用缓存机制，减少重复读取

## 9. 完整示例

### 9.1 浏览器环境示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>本地存储模块示例</title>
</head>
<body>
    <h1>本地存储模块示例</h1>
    <div id="result"></div>

    <script src="src/storage/localStorage.js"></script>
    <script>
        async function runExample() {
            const resultDiv = document.getElementById('result');
            
            try {
                // 1. 初始化数据库
                resultDiv.innerHTML += '<p>1. 初始化数据库...</p>';
                await localStorageModule.initDatabase();
                resultDiv.innerHTML += '<p>✅ 数据库初始化成功</p>';
                
                // 2. 存储数据
                resultDiv.innerHTML += '<p>2. 存储数据...</p>';
                const identity = {
                    id: Date.now().toString(),
                    nickname: '示例用户',
                    emoji: '😊',
                    created_at: Date.now()
                };
                await localStorageModule.saveData('identities', identity);
                resultDiv.innerHTML += '<p>✅ 数据存储成功</p>';
                
                // 3. 读取数据
                resultDiv.innerHTML += '<p>3. 读取数据...</p>';
                const savedIdentity = await localStorageModule.getData('identities', identity.id);
                resultDiv.innerHTML += `<p>✅ 读取的身份数据: ${JSON.stringify(savedIdentity)}</p>`;
                
                // 4. 更新数据
                resultDiv.innerHTML += '<p>4. 更新数据...</p>';
                await localStorageModule.updateData('identities', identity.id, {
                    nickname: '更新后的示例用户'
                });
                const updatedIdentity = await localStorageModule.getData('identities', identity.id);
                resultDiv.innerHTML += `<p>✅ 更新后的身份数据: ${JSON.stringify(updatedIdentity)}</p>`;
                
                // 5. 读取所有数据
                resultDiv.innerHTML += '<p>5. 读取所有数据...</p>';
                const allIdentities = await localStorageModule.getAllData('identities');
                resultDiv.innerHTML += `<p>✅ 所有身份数据数量: ${allIdentities.length}</p>`;
                
                // 6. 删除数据
                resultDiv.innerHTML += '<p>6. 删除数据...</p>';
                await localStorageModule.deleteData('identities', identity.id);
                const deletedIdentity = await localStorageModule.getData('identities', identity.id);
                resultDiv.innerHTML += `<p>✅ 删除后的身份数据: ${deletedIdentity}</p>`;
                
            } catch (error) {
                resultDiv.innerHTML += `<p>❌ 发生错误: ${error.message}</p>`;
            }
        }

        // 运行示例
        runExample();
    </script>
</body>
</html>
```

### 9.2 Node.js环境示例

```javascript
const localStorageModule = require('./src/storage/localStorage');

async function runExample() {
    try {
        // 1. 初始化数据库
        console.log('1. 初始化数据库...');
        await localStorageModule.initDatabase();
        console.log('✅ 数据库初始化成功');
        
        // 2. 存储数据
        console.log('\n2. 存储数据...');
        const identity = {
            id: Date.now().toString(),
            nickname: '示例用户',
            emoji: '😊',
            created_at: Date.now()
        };
        await localStorageModule.saveData('identities', identity);
        console.log('✅ 数据存储成功');
        
        // 3. 读取数据
        console.log('\n3. 读取数据...');
        const savedIdentity = await localStorageModule.getData('identities', identity.id);
        console.log('✅ 读取的身份数据:', savedIdentity);
        
        // 4. 更新数据
        console.log('\n4. 更新数据...');
        await localStorageModule.updateData('identities', identity.id, {
            nickname: '更新后的示例用户'
        });
        const updatedIdentity = await localStorageModule.getData('identities', identity.id);
        console.log('✅ 更新后的身份数据:', updatedIdentity);
        
        // 5. 读取所有数据
        console.log('\n5. 读取所有数据...');
        const allIdentities = await localStorageModule.getAllData('identities');
        console.log('✅ 所有身份数据数量:', allIdentities.length);
        
        // 6. 删除数据
        console.log('\n6. 删除数据...');
        await localStorageModule.deleteData('identities', identity.id);
        const deletedIdentity = await localStorageModule.getData('identities', identity.id);
        console.log('✅ 删除后的身份数据:', deletedIdentity);
        
    } catch (error) {
        console.error('❌ 发生错误:', error);
    }
}

// 运行示例
runExample();
```

## 10. 注意事项

1. **存储空间限制**：不同浏览器对LocalStorage的存储容量有限制（通常为5MB），IndexedDB的存储容量较大但也有限制
2. **数据安全**：本地存储的数据存储在用户设备上，不是绝对安全的，不要存储敏感信息
3. **数据备份**：建议定期备份重要数据，避免用户清除浏览器数据导致数据丢失
4. **性能考虑**：存储大量数据时可能会影响性能，建议合理设计数据结构和存储策略
5. **浏览器兼容性**：虽然模块支持自动降级，但在老旧浏览器上可能会有性能差异

## 11. 总结

本地存储模块提供了一套完整的本地数据存储解决方案，支持多层降级方案，确保在各种环境下都能正常工作。通过简单的API接口，开发者可以方便地实现数据的存储、读取、更新、删除和清空操作，为应用提供可靠的数据持久化能力。

该模块符合规格文档中的设计要求，支持身份、心事和卡片数据的存储，为整个应用的正常运行提供了基础数据存储服务。