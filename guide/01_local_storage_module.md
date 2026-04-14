# 本地存储模块 - 详细规格说明

## 1. 模块概述

### 1.1 模块名称
本地存储模块（Local Storage Module）

### 1.2 模块目标
提供可靠的客户端本地数据存储能力，支持应用数据的持久化和离线访问。

### 1.3 模块定位
作为整个应用的基础数据存储层，为其他模块提供数据读写服务。

## 2. 功能需求

### 2.1 核心功能
- **数据存储**：将应用数据持久化存储到浏览器本地
- **数据读取**：从本地存储中读取数据
- **数据更新**：更新本地存储中的数据
- **数据删除**：删除本地存储中的数据
- **数据清空**：清空指定类型的所有数据

### 2.2 数据结构

#### 2.2.1 身份数据
```javascript
interface Identity {
  id: string;           // 唯一标识符
  nickname: string;     // 昵称
  emoji: string;        // 表情
  created_at: number;   // 创建时间戳
}
```

#### 2.2.2 心事数据
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

#### 2.2.3 卡片数据
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

## 3. 技术实现

### 3.1 技术栈
- **存储方案**：IndexedDB（主要） + LocalStorage（备份）
- **API**：浏览器原生 IndexedDB API
- **库**：idb-keyval（可选，简化IndexedDB操作）

### 3.2 实现方案

#### 3.2.1 数据库设计
- **数据库名称**：`huashuo_app`
- **版本**：1
- **存储对象**：
  - `identities`：存储身份数据
  - `posts`：存储心事数据
  - `cards`：存储卡片数据

#### 3.2.2 核心方法

##### 3.2.2.1 初始化数据库
```javascript
function initDatabase() {
  // 打开或创建数据库
  // 创建存储对象
  // 返回数据库实例
}
```

##### 3.2.2.2 数据存储
```javascript
function saveData(storeName, data) {
  // 向指定存储对象写入数据
  // 处理写入失败的情况
}
```

##### 3.2.2.3 数据读取
```javascript
function getData(storeName, id) {
  // 从指定存储对象读取数据
  // 返回读取结果
}

function getAllData(storeName, query) {
  // 从指定存储对象读取所有符合条件的数据
  // 返回读取结果数组
}
```

##### 3.2.2.4 数据更新
```javascript
function updateData(storeName, id, updates) {
  // 更新指定存储对象中的数据
  // 处理更新失败的情况
}
```

##### 3.2.2.5 数据删除
```javascript
function deleteData(storeName, id) {
  // 从指定存储对象删除数据
  // 处理删除失败的情况
}

function clearData(storeName) {
  // 清空指定存储对象中的所有数据
  // 处理清空失败的情况
}
```

## 4. 测试方案

### 4.1 单元测试
- **测试场景**：
  - 数据库初始化成功
  - 数据存储成功
  - 数据读取成功
  - 数据更新成功
  - 数据删除成功
  - 数据清空成功
  - 错误处理正确

### 4.2 集成测试
- **测试场景**：
  - 与身份管理模块集成
  - 与情绪树洞模块集成
  - 与卡片生成模块集成

### 4.3 性能测试
- **测试场景**：
  - 存储大量数据的性能
  - 读取大量数据的性能
  - 离线状态下的操作性能

## 5. 部署与兼容性

### 5.1 浏览器兼容性
- **支持的浏览器**：
  - Chrome 60+
  - Firefox 55+
  - Safari 12+
  - Edge 79+

### 5.2 降级方案
- **IndexedDB 不可用**：使用 LocalStorage 作为降级方案
- **LocalStorage 也不可用**：使用内存存储（会话期间有效）

## 6. 风险与应对

### 6.1 风险
- **存储空间限制**：浏览器对本地存储有大小限制
- **数据丢失**：用户可能会清除浏览器数据
- **兼容性问题**：不同浏览器对 IndexedDB 的支持程度不同

### 6.2 应对措施
- **存储空间管理**：定期清理过期数据，提示用户存储空间使用情况
- **数据备份**：提供数据导出功能，允许用户备份数据
- **降级方案**：实现多层存储方案，确保在各种情况下都能正常工作

## 7. 依赖关系

### 7.1 依赖模块
- 无

### 7.2 被依赖模块
- 身份管理模块
- 情绪树洞模块
- 卡片生成模块
- 拥抱回流模块

## 8. 开发计划

### 8.1 开发步骤
1. 设计数据库结构
2. 实现数据库初始化
3. 实现核心CRUD操作
4. 实现错误处理
5. 实现降级方案
6. 编写测试用例
7. 集成测试

### 8.2 预期完成时间
- **估计时间**：1-2周
- **关键路径**：数据库设计和核心CRUD操作实现

## 9. 验收标准

### 9.1 功能验收
- 数据库初始化成功
- 数据存储、读取、更新、删除操作正常
- 错误处理正确
- 降级方案有效

### 9.2 性能验收
- 存储和读取操作响应时间 < 500ms
- 能够存储至少1000条心事数据
- 离线状态下操作正常

### 9.3 兼容性验收
- 在支持的浏览器中正常工作
- 在不同设备上表现一致