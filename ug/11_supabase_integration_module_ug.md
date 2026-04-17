# Supabase集成模块使用说明

## 1. 模块介绍

Supabase集成模块（Supabase Integration Module）是话说APP的数据存储核心模块，集成Supabase服务，实现分享卡片和拥抱计数的数据存储。

### 核心特性

- **数据存储**：存储分享卡片数据
- **数据读取**：读取分享卡片数据
- **数据更新**：更新拥抱计数
- **数据验证**：验证数据的合法性
- **错误处理**：处理Supabase操作错误
- **降级方案**：当Supabase不可用时使用本地模拟数据

## 2. 安装方法

### 2.1 环境要求

- **Python版本**：3.8+
- **依赖**：
  - `supabase-py`
  - `python-dotenv`

### 2.2 安装步骤

1. **安装依赖**：
   ```bash
   pip install supabase python-dotenv
   ```

2. **配置环境变量**：
   创建 `.env` 文件：
   ```
   # .env
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_KEY=<your-supabase-key>
   ```

3. **配置Supabase项目**：
   - 创建Supabase项目
   - 创建 `shared_cards` 表
   - 创建 `hugs` 表
   - 配置Row Level Security规则

## 3. 核心功能使用

### 3.1 创建分享卡片

```python
from app.services.share_service import create_share

async def main():
    ai_poem = "月上柳梢人静时"
    mood_band = 1
    result = await create_share(ai_poem, mood_band)
    print(result)

# 输出示例
# {
#     "share_id": "550e8400-e29b-41d4-a716-446655440000",
#     "share_url": "https://huashuo.app/s/550e8400-e29b-41d4-a716-446655440000"
# }
```

**参数说明**：
- `ai_poem`：AI生成的诗句
- `mood_band`：情绪类型（0-2）

**返回值**：
- `share_id`：分享ID
- `share_url`：分享链接

### 3.2 增加拥抱计数

```python
from app.services.share_service import add_hug

async def main():
    share_id = "550e8400-e29b-41d4-a716-446655440000"
    device_id = "test-device-123"
    result = await add_hug(share_id, device_id)
    print(result)

# 输出示例
# {
#     "hugs_count": 1
# }
```

**参数说明**：
- `share_id`：分享ID
- `device_id`：设备ID

**返回值**：
- `hugs_count`：更新后的拥抱数

### 3.3 批量获取拥抱计数

```python
from app.services.share_service import batch_get_hugs

async def main():
    share_ids = ["550e8400-e29b-41d4-a716-446655440000"]
    result = await batch_get_hugs(share_ids)
    print(result)

# 输出示例
# {
#     "items": [
#         {
#             "share_id": "550e8400-e29b-41d4-a716-446655440000",
#             "hugs_count": 1
#         }
#     ]
# }
```

**参数说明**：
- `share_ids`：分享ID列表

**返回值**：
- `items`：包含分享ID和拥抱数的列表

### 3.4 通过ID获取分享卡片

```python
from app.services.share_service import get_share_by_id

async def main():
    share_id = "550e8400-e29b-41d4-a716-446655440000"
    result = await get_share_by_id(share_id)
    print(result)

# 输出示例
# {
#     "share_id": "550e8400-e29b-41d4-a716-446655440000",
#     "ai_poem": "月上柳梢人静时",
#     "mood_band": 1,
#     "hugs_count": 1,
#     "created_at": "2023-01-01T00:00:00Z",
#     "updated_at": "2023-01-01T00:00:00Z",
#     "last_hug_at": "2023-01-01T00:00:00Z"
# }
```

**参数说明**：
- `share_id`：分享ID

**返回值**：
- 分享卡片对象或`None`

### 3.5 获取拥抱计数

```python
from app.services.share_service import get_hug_count

async def main():
    share_id = "550e8400-e29b-41d4-a716-446655440000"
    result = await get_hug_count(share_id)
    print(result)  # 输出: 1
```

**参数说明**：
- `share_id`：分享ID

**返回值**：
- 拥抱数

## 4. 配置选项

### 4.1 环境变量

| 环境变量 | 说明 | 必需 |
|---------|------|------|
| `SUPABASE_URL` | Supabase项目URL | 是 |
| `SUPABASE_KEY` | Supabase服务密钥 | 是 |

### 4.2 Supabase表结构

#### 4.2.1 `shared_cards`表

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|---------|------|------|
| `share_id` | UUID | PRIMARY KEY | 分享ID |
| `ai_poem` | TEXT | NOT NULL | AI生成的诗句 |
| `mood_band` | INTEGER | NOT NULL | 情绪类型（0-2） |
| `hugs_count` | INTEGER | DEFAULT 0 | 拥抱计数 |
| `created_at` | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| `last_hug_at` | TIMESTAMP | NULL | 最后拥抱时间 |

#### 4.2.2 `hugs`表

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|---------|------|------|
| `id` | SERIAL | PRIMARY KEY | 拥抱记录ID |
| `share_id` | UUID | REFERENCES shared_cards(share_id) | 分享ID |
| `device_id` | TEXT | NOT NULL | 设备ID |
| `created_at` | TIMESTAMP | DEFAULT NOW() | 创建时间 |

### 4.3 Row Level Security规则

#### 4.3.1 `shared_cards`表规则

```sql
-- 允许读取
CREATE POLICY "Allow read access" ON shared_cards
  FOR SELECT USING (true);

-- 只允许后端服务插入
CREATE POLICY "Allow insert from service" ON shared_cards
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 只允许通过RPC更新
CREATE POLICY "Allow update via RPC" ON shared_cards
  FOR UPDATE USING (auth.role() = 'service_role');
```

#### 4.3.2 `hugs`表规则

```sql
-- 允许插入
CREATE POLICY "Allow insert access" ON hugs
  FOR INSERT WITH CHECK (true);

-- 允许读取
CREATE POLICY "Allow read access" ON hugs
  FOR SELECT USING (true);
```

## 5. 业务规则

### 5.1 数据验证

- **分享卡片**：
  - 诗句不能为空
  - 情绪类型必须是0、1或2
- **拥抱操作**：
  - 分享ID不能为空
  - 设备ID不能为空
  - 同一设备对同一分享只能拥抱一次

### 5.2 错误处理

- **Supabase操作错误**：捕获并记录错误，降级到本地处理
- **数据验证错误**：抛出ValueError异常
- **分享卡片不存在**：抛出异常

### 5.3 降级方案

当Supabase不可用时，模块会自动使用本地模拟数据，确保服务不会中断。

## 6. 性能优化

### 6.1 索引优化

- 在`shared_cards`表的`share_id`字段上创建索引
- 在`hugs`表的`share_id`和`device_id`字段上创建复合索引

### 6.2 查询优化

- 使用`select`指定需要的字段，减少数据传输
- 使用`eq`和`in`操作符进行精确查询
- 避免全表扫描

### 6.3 并发处理

- 使用异步操作提高并发处理能力
- 合理使用事务，确保数据一致性

## 7. 安全配置

### 7.1 密钥管理

- 使用环境变量存储Supabase密钥，避免硬编码
- 定期轮换Supabase密钥

### 7.2 Row Level Security

- 配置合理的RLS规则，限制数据访问权限
- 只允许授权的操作

### 7.3 防刷措施

- 基于设备ID限制拥抱次数
- 实现速率限制，防止恶意请求

## 8. 测试方法

### 8.1 运行测试

```bash
cd api
python test_supabase_integration.py
```

### 8.2 测试场景

- **创建分享卡片**：验证创建功能正常
- **增加拥抱计数**：验证拥抱功能正常
- **批量获取拥抱计数**：验证批量查询功能正常
- **通过ID获取分享卡片**：验证查询功能正常
- **获取拥抱计数**：验证计数功能正常
- **错误处理**：验证错误处理机制正常

### 8.3 集成测试

- 与API服务模块集成测试
- 与前端拥抱回流模块集成测试

## 9. 依赖关系

### 9.1 依赖服务

- **Supabase**：用于数据存储

### 9.2 依赖库

| 库名 | 版本 | 用途 |
|------|------|------|
| supabase | ^2.0.0 | Supabase客户端 |
| python-dotenv | ^1.0.0 | 环境变量管理 |

## 10. 常见问题与解决方案

### 10.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Supabase连接失败 | 网络问题或配置错误 | 检查网络连接，验证环境变量配置 |
| 数据写入失败 | 权限不足或表结构错误 | 检查RLS规则，验证表结构 |
| 拥抱计数不增加 | 设备ID重复或防刷限制 | 使用不同的设备ID，检查防刷规则 |
| 批量查询性能差 | 数据量过大或索引缺失 | 优化索引，分批查询 |

### 10.2 解决方案

1. **Supabase连接失败**：
   - 检查网络连接
   - 验证SUPABASE_URL和SUPABASE_KEY配置
   - 检查Supabase服务状态

2. **数据写入失败**：
   - 检查RLS规则配置
   - 验证表结构是否正确
   - 检查服务角色权限

3. **拥抱计数不增加**：
   - 使用不同的设备ID
   - 检查hugs表是否有重复记录
   - 检查防刷规则

4. **批量查询性能差**：
   - 在shared_cards表的share_id字段上创建索引
   - 限制批量查询的数量
   - 分批处理大量数据

## 11. 总结

Supabase集成模块是话说APP的数据存储核心，通过集成Supabase服务，实现了分享卡片和拥抱计数的数据存储。模块具有完善的错误处理和降级方案，确保在Supabase不可用时仍能正常工作。

通过合理的数据验证、错误处理和性能优化，模块提供了稳定可靠的数据存储服务。同时，模块支持与API服务模块和前端拥抱回流模块的集成，为整个应用提供了完整的数据存储解决方案。

在生产环境中，建议配置Supabase项目、设置合理的RLS规则、优化索引，并实现防刷措施，确保服务的安全性和可靠性。