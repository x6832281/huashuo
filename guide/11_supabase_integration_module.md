# Supabase集成模块 - 详细规格说明

## 1. 模块概述

### 1.1 模块名称
Supabase集成模块（Supabase Integration Module）

### 1.2 模块目标
集成Supabase服务，实现分享卡片和拥抱计数的数据存储。

### 1.3 模块定位
作为API服务模块的子模块，提供数据存储能力。

## 2. 功能需求

### 2.1 核心功能
- **数据存储**：存储分享卡片数据
- **数据读取**：读取分享卡片数据
- **数据更新**：更新拥抱计数
- **数据验证**：验证数据的合法性
- **错误处理**：处理Supabase操作错误

### 2.2 业务规则
- **表结构**：使用`shared_cards`表存储分享卡片数据
- **字段约束**：
  - `share_id`：UUID类型，主键
  - `ai_poem`：文本类型，存储AI生成的诗句
  - `mood_band`：整数类型，范围0-2
  - `hugs_count`：整数类型，默认0
  - `created_at`：时间戳类型
  - `updated_at`：时间戳类型
  - `last_hug_at`：时间戳类型，可选
- **安全规则**：
  - 读取：允许按`share_id`读取单条
  - 写入：仅后端服务可插入新卡片
  - 更新：只允许通过RPC做受控自增

## 3. 技术实现

### 3.1 技术栈
- **语言**：Python
- **Supabase客户端**：supabase-py
- **环境管理**：环境变量
- **错误处理**：try-except

### 3.2 实现方案

#### 3.2.1 核心方法

##### 3.2.2.1 初始化Supabase客户端
```python
# services/share_service.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
```

##### 3.2.2.2 创建分享卡片
```python
def create_share(ai_poem, mood_band):
    import uuid
    
    share_id = str(uuid.uuid4())
    
    try:
        # 插入新卡片
        response = supabase.table("shared_cards").insert({
            "share_id": share_id,
            "ai_poem": ai_poem,
            "mood_band": mood_band,
            "hugs_count": 0
        }).execute()
        
        if response.data:
            share_url = f"https://<你的域名>/s/{share_id}"
            return {
                "share_id": share_id,
                "share_url": share_url
            }
        else:
            raise Exception("创建分享卡片失败")
    except Exception as e:
        raise Exception(f"Supabase操作错误: {str(e)}")
```

##### 3.2.2.3 增加拥抱计数
```python
def add_hug(share_id, device_id):
    try:
        # 检查share_id是否存在
        existing_card = supabase.table("shared_cards").select("*").eq("share_id", share_id).execute()
        
        if not existing_card.data:
            raise Exception("分享卡片不存在")
        
        # 增加拥抱计数
        response = supabase.rpc("increment_hug", {
            "card_id": share_id,
            "device_id": device_id
        }).execute()
        
        if response.data:
            return {
                "hugs_count": response.data
            }
        else:
            raise Exception("增加拥抱计数失败")
    except Exception as e:
        raise Exception(f"Supabase操作错误: {str(e)}")
```

##### 3.2.2.4 批量获取拥抱计数
```python
def batch_get_hugs(share_ids):
    try:
        # 批量查询拥抱计数
        response = supabase.table("shared_cards").select("share_id, hugs_count").in_("share_id", share_ids).execute()
        
        if response.data:
            items = [
                {"share_id": item["share_id"], "hugs_count": item["hugs_count"]}
                for item in response.data
            ]
            return {
                "items": items
            }
        else:
            return {
                "items": []
            }
    except Exception as e:
        raise Exception(f"Supabase操作错误: {str(e)}")
```

#### 3.2.3 Supabase RPC函数
```sql
-- increment_hug RPC函数
CREATE OR REPLACE FUNCTION increment_hug(card_id UUID, device_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- 检查是否已经给过拥抱（基于device_id）
    -- 这里可以添加防刷逻辑
    
    -- 增加拥抱计数
    UPDATE shared_cards
    SET hugs_count = hugs_count + 1,
        updated_at = NOW(),
        last_hug_at = NOW()
    WHERE share_id = card_id;
    
    -- 返回更新后的拥抱计数
    SELECT hugs_count INTO current_count FROM shared_cards WHERE share_id = card_id;
    RETURN current_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 4. 测试方案

### 4.1 单元测试
- **测试场景**：
  - 创建分享卡片
  - 增加拥抱计数
  - 批量获取拥抱计数
  - 错误处理

### 4.2 集成测试
- **测试场景**：
  - 与API服务模块集成
  - 与前端拥抱回流模块集成

### 4.3 性能测试
- **测试场景**：
  - 批量查询性能
  - 并发更新性能

## 5. 部署与兼容性

### 5.1 环境配置
- **Python版本**：3.8+
- **依赖**：supabase-py、python-dotenv
- **环境变量**：SUPABASE_URL、SUPABASE_KEY

### 5.2 安全配置
- **密钥管理**：通过环境变量存储Supabase密钥
- **Row Level Security**：配置合理的RLS规则

## 6. 风险与应对

### 6.1 风险
- **服务不可用**：Supabase服务可能出现故障
- **数据不一致**：本地数据与Supabase数据可能不一致
- **性能问题**：大量数据操作可能影响性能

### 6.2 应对措施
- **错误处理**：捕获并处理Supabase操作错误
- **数据同步**：实现简单的数据同步机制
- **性能优化**：合理使用索引，优化查询

## 7. 依赖关系

### 7.1 依赖模块
- 无

### 7.2 被依赖模块
- API服务模块

## 8. 开发计划

### 8.1 开发步骤
1. 配置Supabase项目
2. 创建`shared_cards`表
3. 实现Supabase客户端初始化
4. 实现创建分享卡片功能
5. 实现增加拥抱计数功能
6. 实现批量获取拥抱计数功能
7. 编写测试用例
8. 集成测试

### 8.2 预期完成时间
- **估计时间**：1-2周
- **关键路径**：Supabase配置和核心功能实现

## 9. 验收标准

### 9.1 功能验收
- 创建分享卡片成功
- 增加拥抱计数成功
- 批量获取拥抱计数成功
- 错误处理合理

### 9.2 性能验收
- 创建分享卡片响应时间 < 1s
- 增加拥抱计数响应时间 < 500ms
- 批量获取拥抱计数响应时间 < 1s

### 9.3 安全验收
- 密钥管理安全
- RLS规则配置合理
- 无明显安全漏洞