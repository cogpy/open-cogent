export const summaryContent = `## ✅ 总结

这个多列布局 Markdown 解析器提供了强大而灵活的布局能力：

### 核心优势

- **🎯 精确控制** - 精确的列宽和间距控制
- **🔄 双向转换** - Markdown ↔ BlockSnapshot 无损转换
- **🏗️ 无限嵌套** - 支持任意深度的布局嵌套
- **⚡ 高性能** - 优化的解析和渲染算法
- **🛠️ 易于集成** - 简单的 API 和完善的文档

### 使用方法

\`\`\`typescript
// 将 Markdown 转换为 BlockSnapshot
const snapshot = await SimpleLayoutConverter
  .markdownToSnapshot(markdown);

// 将 BlockSnapshot 转换回 Markdown
const markdown = await SimpleLayoutConverter
  .snapshotToMarkdown(snapshot);
\`\`\`

通过这个解析器，你可以轻松创建复杂的多列文档布局，同时保持 Markdown 的简洁性和可读性。`;
