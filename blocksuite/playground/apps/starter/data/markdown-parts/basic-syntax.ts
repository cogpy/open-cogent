export const basicSyntaxContent = `# Markdown 布局解析器测试

这个页面用于测试新的多列布局 Markdown 解析器功能。

## 📝 支持的语法

下面是基本的多列布局语法示例：

<!-- layout:multi-column
{
  "id": "syntax-example",
  "columns": [
    {"id": "left", "width": 50},
    {"id": "right", "width": 50}
  ]
}
-->

<!-- content:column
{
  "parent": "syntax-example",
  "insert": "left"
}
-->

### 布局声明语法

\`\`\`markdown
<!-- layout:multi-column
{
  "id": "layout-id",
  "gap": 20,
  "columns": [
    {"id": "col1", "width": 60},
    {"id": "col2", "width": 40}
  ]
}
-->
\`\`\`

**特性：**
- 支持任意列数
- 灵活的宽度配置
- 可自定义间距

<!-- end:content:column -->

<!-- content:column
{
  "parent": "syntax-example",
  "insert": "right"
}
-->

### 内容块语法

\`\`\`markdown
<!-- content:column
{
  "parent": "layout-id",
  "insert": "col1"
}
-->
列内容...
<!-- end:content:column -->
\`\`\`

**优势：**
- 语法简洁明了
- 易于理解和维护
- 支持复杂嵌套结构

<!-- end:content:column -->`;
