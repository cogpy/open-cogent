export const twoColumnDemoContent = `## 🎯 基本两列布局示例

下面展示一个实际的两列布局：

<!-- layout:multi-column
{
  "id": "basic-demo",
  "gap": 24,
  "columns": [
    {"id": "main", "width": 65},
    {"id": "sidebar", "width": 35}
  ]
}
-->

<!-- content:column
{
  "parent": "basic-demo",
  "insert": "main"
}
-->

### 主要内容区域

这是主要的内容区域，占据较大的宽度用于显示核心信息。

#### 功能特性

1. **完整的 Markdown 支持** - 兼容标准 Markdown 语法
2. **灵活的布局配置** - 支持任意列数和宽度比例
3. **无限嵌套能力** - 可以创建复杂的布局结构
4. **高性能解析** - 优化的解析算法，快速处理

#### 技术实现

解析器采用以下技术栈：

- **TypeScript** - 类型安全的开发体验
- **Remark.js** - 强大的 Markdown 处理引擎
- **BlockSuite** - 现代化的块编辑器框架
- **Vite** - 快速的构建工具

\`\`\`typescript
// 使用示例
const snapshot = await SimpleLayoutConverter
  .markdownToSnapshot(markdown);
\`\`\`

<!-- end:content:column -->

<!-- content:column
{
  "parent": "basic-demo",
  "insert": "sidebar"
}
-->

### 侧边栏信息

这是侧边栏区域，用于显示辅助信息。

#### 快速导航

- [语法文档](#syntax)
- [示例代码](#examples)
- [API 参考](#api)
- [常见问题](#faq)

#### 统计信息

- **解析速度**: < 10ms
- **支持嵌套**: 无限层级
- **兼容性**: 100%
- **文件大小**: < 50KB

#### 版本信息

- **当前版本**: v1.0.0
- **最后更新**: 2025-01-21
- **许可证**: MIT
- **维护状态**: 活跃开发

> **提示**: 这个解析器完全兼容标准 Markdown 语法，可以无缝集成到现有项目中。

<!-- end:content:column -->`;
