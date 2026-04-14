# 计划｜将最终PRD改为仅安卓（Android Only）并重新整理

## 1. 目标
- 将最终需求文档从“跨平台/iOS+Android”口径，调整为“仅安卓 App（Android Only）”。
- 让文档在研发交付维度保持一致：章节叙述、验收标准、权限/发布、测试矩阵都不再出现 iOS 相关内容。

## 2. 当前状态（基于仓库事实）
- 当前仓库仅保留最终版 Markdown： [话说APP需求文档（PRD）-完整.md](file:///e:/learning/web/260406/whisper/%E8%AF%9D%E8%AF%B4APP%E9%9C%80%E6%B1%82%E6%96%87%E6%A1%A3%EF%BC%88PRD%EF%BC%89-%E5%AE%8C%E6%95%B4.md)
- 文档中仍存在 “iOS/Android” 的验收描述（例如卡片导出验收），需要改为 Android-only。
- 你当前硬件为 Windows（无 Mac），选择 Android Only 与开发条件匹配。

## 3. 拟修改内容（决策已闭合）
仅修改 1 个文件： [话说APP需求文档（PRD）-完整.md](file:///e:/learning/web/260406/whisper/%E8%AF%9D%E8%AF%B4APP%E9%9C%80%E6%B1%82%E6%96%87%E6%A1%A3%EF%BC%88PRD%EF%BC%89-%E5%AE%8C%E6%95%B4.md)

### 3.1 文档头部与范围口径
- 在“V1.0 目标与边界”或文档开头明确：V1.0 仅交付 Android 版本（Windows 开发环境）。
- 删除/替换任何暗示双端交付的表述（如 iOS/Android 并列）。

### 3.2 Android 专项补齐
补充一小节（放在“非功能性需求”或“验收清单”附近）用于 Android-only 的落地说明：
- Android 版本支持范围（建议：Android 12–14 优先验证，兼容目标可写 11+）。
- 权限与媒体导出要点（相册/媒体权限、Android 13+ 的权限差异）。
- 构建与分发方式（Debug 安装、APK/AAB、内测分发渠道可写为“待定/后续”）。

### 3.3 逐条验收替换为 Android-only
- 将 “iOS/Android 导出成功” 类描述改为 Android-only（同时保留“拒绝权限不崩溃、有提示”等验收）。
- 清理可能出现的 iOS 特有词（TestFlight、App Store、iOS 权限等；若不存在则无需改）。

### 3.4 一致性自检
- 全文搜索关键字：`iOS`、`Android`、`TestFlight`、`App Store`，确保不再出现 iOS 交付口径。
- 验收清单与前文描述一致：Android-only、权限模型一致、失败降级一致。

## 4. 验证方式（完成后检查）
- 文档一致性：全文无 iOS 交付/验收/发布描述。
- Android 可执行性：权限/导出/分享/扫码/H5 回流在文档中均能对应到 Android 侧实现与验收条目。

