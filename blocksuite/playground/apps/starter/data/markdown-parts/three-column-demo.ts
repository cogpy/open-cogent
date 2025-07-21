export const threeColumnDemoContent = `## 🔧 三列布局示例

下面展示更复杂的三列布局：

<!-- layout:multi-column
{
  "id": "three-column-demo",
  "gap": 16,
  "columns": [
    {"id": "left-nav", "width": 20},
    {"id": "main-content", "width": 60},
    {"id": "right-info", "width": 20}
  ]
}
-->

<!-- content:column
{
  "parent": "three-column-demo",
  "insert": "left-nav"
}
-->

### 导航菜单

**主要功能**
- 首页
- 文档
- 示例
- API

**工具链接**
- GitHub
- 问题反馈
- 社区讨论
- 更新日志

**相关资源**
- 教程视频
- 最佳实践
- 性能优化
- 故障排除

<!-- end:content:column -->

<!-- content:column
{
  "parent": "three-column-demo",
  "insert": "main-content"
}
-->

### 核心内容区域

这是三列布局的核心内容区域，展示主要信息。

#### 解析器工作原理

解析过程分为以下几个步骤：

1. **词法分析** - 扫描 Markdown 文本，识别布局注释
2. **语法解析** - 解析 JSON 配置，构建布局树结构
3. **内容提取** - 提取各个内容块并关联到对应位置
4. **树构建** - 构建完整的 BlockSuite 块树结构
5. **渲染输出** - 生成最终的可视化布局

#### 性能优化策略

- **增量解析** - 只处理变更的部分，减少重复计算
- **缓存机制** - 缓存布局配置和解析结果
- **懒加载** - 支持大型文档的按需加载
- **并行处理** - 多线程处理复杂布局

\`\`\`javascript
// 性能监控示例
console.time('markdown-parse');
const result = parseLayoutMarkdown(content);
console.timeEnd('markdown-parse');
\`\`\`

<!-- end:content:column -->

<!-- content:column
{
  "parent": "three-column-demo",
  "insert": "right-info"
}
-->

### 辅助信息

**技术指标**
- 内存占用: < 10MB
- CPU 使用: < 5%
- 网络请求: 0
- 依赖包: 最小化

**浏览器支持**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**开发工具**
- VS Code 插件
- 语法高亮
- 实时预览
- 错误检查

**社区支持**
- 活跃的开发者社区
- 定期的版本更新
- 完善的文档体系
- 及时的技术支持

<!-- end:content:column -->`;
