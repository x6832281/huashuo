# 情绪树洞模块使用说明

## 1. 模块介绍

情绪树洞模块（Emotion Tree Hole Module）是话说APP的核心功能模块，提供用户心事的发布、浏览、管理功能，支持情绪频段的自动识别和手动纠错。

### 核心特性

- **心事发布**：用户发布纯文字心事
- **情绪频段识别**：AI自动识别情绪频段
- **频段纠错**：用户可手动修改情绪频段（仅限1次）
- **心事列表**：按时间排序展示心事
- **心事筛选**：按情绪频段、归档状态筛选
- **心事详情**：查看心事详情
- **心事管理**：归档、删除心事
- **脱敏提示**：检测疑似敏感信息并提醒

## 2. 安装方法

### 2.1 引入模块

在 Node.js 环境中：

```javascript
const emotionTreeHoleModule = require('./src/emotion/emotionTreeHole');
```

在浏览器环境中：

```html
<script src="path/to/emotionTreeHole.js"></script>
```

### 2.2 依赖模块

情绪树洞模块依赖于以下模块：

```javascript
const localStorageModule = require('./src/storage/localStorage');
const identityManagementModule = require('./src/identity/identityManagement');
```

## 3. 核心功能使用

### 3.1 发布心事

```javascript
const result = await emotionTreeHoleModule.createPost('今天天气很好，心情不错！');
console.log('心事发布成功:', result.post);
console.log('敏感信息检测:', result.sensitiveInfo);
```

**参数说明**：
- `contentText`：心事内容，纯文字，长度1-1000字

**返回**：
- `post`：创建的心事对象
- `sensitiveInfo`：检测到的敏感信息数组

**抛出错误**：
- 心事内容为空
- 心事内容长度超过1000字

### 3.2 获取心事列表

```javascript
// 获取所有活跃心事
const activePosts = await emotionTreeHoleModule.getPostList({ archived: false });
console.log('活跃心事数量:', activePosts.length);

// 获取所有归档心事
const archivedPosts = await emotionTreeHoleModule.getPostList({ archived: true });
console.log('归档心事数量:', archivedPosts.length);

// 按情绪频段筛选
const happyPosts = await emotionTreeHoleModule.getPostList({ moodBand: 2 });
console.log('开心的心事数量:', happyPosts.length);
```

**参数说明**：
- `filters`：筛选条件
  - `archived`：是否归档（true/false）
  - `moodBand`：情绪频段（0/1/2）

**返回**：心事数组，按创建时间倒序排列

### 3.3 获取心事详情

```javascript
const post = await emotionTreeHoleModule.getPostDetail(postId);
console.log('心事详情:', post);
```

**参数说明**：
- `postId`：心事的唯一标识符

**返回**：心事对象

**抛出错误**：
- 心事ID无效
- 心事不存在
- 无权访问此心事
- 心事已删除

### 3.4 编辑情绪频段

```javascript
const updatedPost = await emotionTreeHoleModule.editMoodBand(postId, 2);
console.log('情绪频段编辑成功:', updatedPost.mood_band_final);
```

**参数说明**：
- `postId`：心事ID
- `newMoodBand`：新的情绪频段（0/1/2）

**返回**：更新后的心事对象

**抛出错误**：
- 心事ID无效
- 情绪频段无效
- 情绪频段只能修改一次

### 3.5 归档心事

```javascript
const archivedPost = await emotionTreeHoleModule.archivePost(postId);
console.log('心事归档成功:', archivedPost.archived_at);
```

**参数说明**：
- `postId`：心事ID

**返回**：归档后的心事对象

**抛出错误**：
- 心事ID无效
- 心事不存在
- 心事已经归档

### 3.6 删除心事

```javascript
const deletedPost = await emotionTreeHoleModule.deletePost(postId);
console.log('心事删除成功:', deletedPost.deleted_at);
```

**参数说明**：
- `postId`：心事ID

**返回**：删除后的心事对象

**抛出错误**：
- 心事ID无效
- 心事不存在
- 心事已经删除

### 3.7 恢复心事

```javascript
const restoredPost = await emotionTreeHoleModule.restorePost(postId);
console.log('心事恢复成功:', restoredPost.archived_at);
```

**参数说明**：
- `postId`：心事ID

**返回**：恢复后的心事对象

**抛出错误**：
- 心事ID无效
- 心事不存在
- 心事未归档

### 3.8 获取心事数量

```javascript
const count = await emotionTreeHoleModule.getPostCount({ archived: false });
console.log('活跃心事数量:', count);
```

**参数说明**：
- `filters`：筛选条件（同 `getPostList`）

**返回**：心事数量

### 3.9 检测敏感信息

```javascript
const sensitiveInfo = emotionTreeHoleModule.detectSensitiveInfo('我的手机号是13800138000');
console.log('敏感信息检测:', sensitiveInfo);
```

**参数说明**：
- `text`：要检测的文本

**返回**：检测到的敏感信息数组

## 4. 数据结构

### 心事对象

```javascript
interface Post {
  id: string;                  // 唯一标识符
  identity_id: string;         // 所属身份ID
  mood_band_ai: number;        // AI建议的情绪频段
  mood_band_final: number;     // 最终情绪频段（用户可纠错）
  mood_band_edit_count: number; // 频段编辑次数（0或1）
  content_text: string;        // 心事内容
  created_at: number;          // 创建时间戳
  archived_at: number | null;  // 归档时间戳（null 表示未归档）
  deleted_at: number | null;   // 删除时间戳（null 表示未删除）
}
```

### 情绪频段

| 频段值 | 标签 | 含义 |
|-------|------|------|
| 0 | 🌧️ 低落/焦虑/疲惫 | 负面情绪 |
| 1 | 🌤️ 平静/波动/复杂 | 中性情绪 |
| 2 | ☀️ 轻松/积极/被接住 | 正面情绪 |

### 敏感信息检测结果

```javascript
interface SensitiveInfo {
  type: string;     // 敏感信息类型（phone/email/idCard/address）
  matches: string[]; // 匹配到的敏感信息列表
}
```

## 5. 业务规则

### 5.1 内容限制

- **长度**：1-1000字
- **格式**：纯文字
- **验证**：自动去除前后空格后验证

### 5.2 情绪频段

- **范围**：仅3档（0/1/2）
- **纠错**：用户可手动修改1次，修改后锁定
- **默认**：AI自动识别，识别失败时默认返回1（平静）

### 5.3 敏感信息检测

- **检测**：手机号、邮箱、身份证号、地址
- **处理**：检测到后提醒，但不强拦截
- **隐私**：敏感信息仅在本地检测，不上传服务器

### 5.4 数据隔离

- **身份绑定**：心事数据与用户身份严格绑定
- **访问控制**：切换身份后只能访问当前身份的心事

### 5.5 心事状态

- **活跃**：正常显示在列表中
- **归档**：可恢复，不显示在默认列表中
- **删除**：标记为删除，不再显示

## 6. 错误处理

模块内置了完善的错误处理机制：

```javascript
try {
  const result = await emotionTreeHoleModule.createPost('今天天气很好！');
  console.log('心事发布成功:', result.post);
} catch (error) {
  console.error('发布失败:', error.message);
}
```

### 常见错误

| 错误信息 | 说明 |
|---------|------|
| 心事内容不能为空 | 内容为空或仅包含空格 |
| 心事内容长度不能超过1000字 | 内容过长 |
| 心事ID无效 | 心事ID格式错误 |
| 心事不存在 | 指定的心事ID不存在 |
| 无权访问此心事 | 尝试访问其他身份的心事 |
| 心事已删除 | 尝试操作已删除的心事 |
| 情绪频段无效 | 情绪频段不是0、1或2 |
| 情绪频段只能修改一次 | 已达到修改次数限制 |
| 心事已经归档 | 尝试重复归档心事 |
| 心事未归档 | 尝试恢复未归档的心事 |
| 心事已经删除 | 尝试重复删除心事 |

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
const emotionTreeHoleModule = require('./src/emotion/emotionTreeHole');
const identityManagementModule = require('./src/identity/identityManagement');

async function runExample() {
    try {
        // 1. 初始化身份
        console.log('1. 初始化身份...');
        await identityManagementModule.getCurrentIdentity();

        // 2. 发布心事
        console.log('\n2. 发布心事...');
        const result = await emotionTreeHoleModule.createPost('今天天气很好，心情不错！');
        const post = result.post;
        console.log('✅ 心事发布成功:', post.id);
        console.log('   情绪频段:', post.mood_band_final);

        // 3. 编辑情绪频段
        console.log('\n3. 编辑情绪频段...');
        const updatedPost = await emotionTreeHoleModule.editMoodBand(post.id, 2);
        console.log('✅ 情绪频段编辑成功，新频段:', updatedPost.mood_band_final);

        // 4. 获取心事列表
        console.log('\n4. 获取心事列表...');
        const posts = await emotionTreeHoleModule.getPostList();
        console.log('✅ 心事列表获取成功，共', posts.length, '条心事');

        // 5. 归档心事
        console.log('\n5. 归档心事...');
        const archivedPost = await emotionTreeHoleModule.archivePost(post.id);
        console.log('✅ 心事归档成功');

        // 6. 恢复心事
        console.log('\n6. 恢复心事...');
        const restoredPost = await emotionTreeHoleModule.restorePost(post.id);
        console.log('✅ 心事恢复成功');

        // 7. 删除心事
        console.log('\n7. 删除心事...');
        const deletedPost = await emotionTreeHoleModule.deletePost(post.id);
        console.log('✅ 心事删除成功');

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
    <title>情绪树洞模块示例</title>
</head>
<body>
    <h1>情绪树洞模块示例</h1>
    <div id="result"></div>

    <script src="src/storage/localStorage.js"></script>
    <script src="src/identity/identityManagement.js"></script>
    <script src="src/emotion/emotionTreeHole.js"></script>
    <script>
        async function runExample() {
            const resultDiv = document.getElementById('result');

            try {
                // 1. 初始化身份
                resultDiv.innerHTML += '<p>1. 初始化身份...</p>';
                await identityManagementModule.getCurrentIdentity();
                resultDiv.innerHTML += '<p>✅ 身份初始化成功</p>';

                // 2. 发布心事
                resultDiv.innerHTML += '<p>2. 发布心事...</p>';
                const result = await emotionTreeHoleModule.createPost('今天天气很好，心情不错！');
                const post = result.post;
                resultDiv.innerHTML += `<p>✅ 心事发布成功: ${post.id}</p>`;
                resultDiv.innerHTML += `<p>   情绪频段: ${post.mood_band_final}</p>`;

                // 3. 获取心事列表
                resultDiv.innerHTML += '<p>3. 获取心事列表...</p>';
                const posts = await emotionTreeHoleModule.getPostList();
                resultDiv.innerHTML += `<p>✅ 心事列表获取成功，共 ${posts.length} 条心事</p>`;

                // 4. 编辑情绪频段
                resultDiv.innerHTML += '<p>4. 编辑情绪频段...</p>';
                const updatedPost = await emotionTreeHoleModule.editMoodBand(post.id, 2);
                resultDiv.innerHTML += `<p>✅ 情绪频段编辑成功，新频段: ${updatedPost.mood_band_final}</p>`;

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

1. **内容限制**：心事内容长度限制为1-1000字，超过会被拒绝
2. **情绪频段**：情绪频段只能修改一次，修改后锁定
3. **敏感信息**：检测到敏感信息会提醒，但不会阻止发布
4. **数据隔离**：心事数据与身份严格绑定，切换身份后只能访问当前身份的心事
5. **心事状态**：删除的心事不可恢复，归档的心事可以恢复
6. **性能优化**：大量心事数据可能影响加载性能，建议实现分页加载
7. **数据安全**：心事数据存储在本地，清除浏览器数据会导致数据丢失

## 10. 总结

情绪树洞模块提供了完整的心事管理功能，包括发布、浏览、编辑、归档和删除操作。通过AI情绪分析和用户手动纠错，确保情绪频段的准确性。模块支持敏感信息检测，保护用户隐私，同时实现了严格的数据隔离，确保不同身份的心事数据互不干扰。

该模块符合需求文档中的设计要求，为用户提供了一个安全、便捷的情绪表达和管理平台。