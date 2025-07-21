export const nestedLayoutDemoContent = `## 🚀 嵌套布局示例

展示布局的嵌套能力：

<!-- layout:multi-column
{
  "id": "nested-outer",
  "columns": [
    {"id": "content-area", "width": 75},
    {"id": "meta-info", "width": 25}
  ]
}
-->

<!-- content:column
{
  "parent": "nested-outer",
  "insert": "content-area"
}
-->

### 嵌套内容区域

这个区域内部包含另一个嵌套的布局结构：

<!-- end:content:column -->

<!-- layout:multi-column
{
  "id": "nested-inner",
  "columns": [
    {"id": "inner-left", "width": 50},
    {"id": "inner-right", "width": 50}
  ],
  "parent": "nested-outer",
  "insert": "content-area"
}
-->

<!-- content:column
{
  "parent": "nested-inner",
  "insert": "inner-left"
}
-->

#### 嵌套左列

这是嵌套布局的左列内容。

**嵌套特性：**
- 支持任意深度嵌套
- 每个布局独立配置
- 可以混合不同列数
- 自动处理布局冲突

**使用场景：**
- 复杂的页面布局
- 响应式设计
- 内容分组展示
- 层次化信息架构

<!-- end:content:column -->

<!-- content:column
{
  "parent": "nested-inner",
  "insert": "inner-right"
}
-->

#### 嵌套右列

这是嵌套布局的右列内容。

**配置示例：**

\`\`\`json
{
  "layout": "nested",
  "depth": 2,
  "parent": "nested-outer",
  "children": ["inner-left", "inner-right"]
}
\`\`\`

**注意事项：**
- 避免过深的嵌套
- 保持合理的宽度比例
- 考虑移动端适配
- 测试不同屏幕尺寸

<!-- end:content:column -->

<!-- content:column
{
  "parent": "nested-outer",
  "insert": "meta-info"
}
-->

### 元数据信息

**布局层级：**
1. 外层布局 (75% + 25%)
2. 内层布局 (50% + 50%)

**技术细节：**
- 递归解析算法
- 树形数据结构
- 自动验证机制
- 错误恢复策略

**性能指标：**
- 解析时间: < 5ms
- 内存使用: < 2MB

<!-- end:content:column -->`;
